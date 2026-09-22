/**
 * 예약 상태 + 이용권 차감/복구 원자 클라이언트.
 * DB: core.update_booking_status_with_pass
 */
import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import { getOrganizationId, getStorageAdapter, STORAGE_KEYS } from '@/services/adapters';
import { setItem } from '@/services/storage/helpers';
import type { Booking, BookingStatus, SessionPass } from '@/core/types/schedule';
import { StorageService } from '@/services/storage';
import { sessionPassService } from './sessionPassService';
import { planBookingPassTransition } from './bookingStatusTransition';
import { mapBookingPassRpcError } from './mapBookingPassRpcError';
import { rowToSessionPass } from '@/services/adapters/sync/sessionPassMappers';

function applyRpcResultToLocalMirror(
  existing: Booking,
  payload: {
    status: BookingStatus;
    session_pass_id?: string | null;
  }
): Booking {
  const sessionPassId =
    payload.session_pass_id == null || payload.session_pass_id === ''
      ? undefined
      : String(payload.session_pass_id);

  return StorageService.saveBooking({
    ...existing,
    status: payload.status,
    sessionPassId,
  });
}

/** demo/offline: 이용권 스냅샷 롤백으로 best-effort 원자성 */
function updateBookingStatusLocally(
  existing: Booking,
  status: BookingStatus,
  options?: { consumeOnNoShow?: boolean }
): Booking | null {
  const plan = planBookingPassTransition(existing, status, options);
  const passesBefore = sessionPassService.list().map((p) => ({ ...p }));
  let sessionPassId = existing.sessionPassId;

  try {
    if (plan.action === 'consume') {
      const consumed = sessionPassService.consume(existing.customerId);
      if (!consumed && sessionPassService.hasEntitlement(existing.customerId)) {
        return null;
      }
      sessionPassId = consumed ?? undefined;
    } else if (plan.action === 'refund') {
      sessionPassService.refund(plan.sessionPassId);
      sessionPassId = undefined;
    } else {
      sessionPassId = plan.sessionPassId;
    }

    return StorageService.saveBooking({
      ...existing,
      status,
      sessionPassId,
    });
  } catch (err) {
    setItem(STORAGE_KEYS.SESSION_PASSES, passesBefore);
    throw err;
  }
}

async function refreshSessionPassMirror(orgId: string): Promise<void> {
  try {
    const client = getCoreClient();
    const { data: passRows, error } = await client
      .from('session_passes' as never)
      .select('*')
      .eq('organization_id', orgId);
    if (error || !Array.isArray(passRows)) return;
    const passes: SessionPass[] = passRows.map((row) =>
      rowToSessionPass(row as Parameters<typeof rowToSessionPass>[0])
    );
    setItem(STORAGE_KEYS.SESSION_PASSES, passes);
  } catch {
    /* mirror refresh best-effort */
  }
}

/**
 * 운영(Supabase+org): flush → RPC → local mirror.
 * demo: local fallback (동일 규칙).
 */
export async function updateBookingStatusAtomic(
  bookingId: string,
  status: BookingStatus,
  options?: { consumeOnNoShow?: boolean }
): Promise<Booking | null> {
  const existing = StorageService.getBookings().find((b) => b.id === bookingId);
  if (!existing) return null;

  const orgId = getOrganizationId();
  const useRpc = Boolean(isSupabaseConfigured() && orgId);

  if (!useRpc) {
    return updateBookingStatusLocally(existing, status, options);
  }

  const adapter = getStorageAdapter();
  if (adapter.flushPersist) {
    const flushed = await adapter.flushPersist([
      STORAGE_KEYS.SCHEDULES,
      STORAGE_KEYS.SESSION_PASSES,
    ]);
    if (!flushed) {
      throw new Error('예약·이용권 원격 동기화에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  const client = getCoreClient();
  const { data, error } = await client.rpc(
    'update_booking_status_with_pass' as never,
    {
      p_organization_id: orgId,
      p_booking_id: bookingId,
      p_new_status: status,
      p_consume_on_no_show: options?.consumeOnNoShow === true,
    } as never
  );

  if (error) {
    const mapped = mapBookingPassRpcError(error);
    if (mapped.code === 'insufficient_pass' || mapped.code === 'not_found') {
      return null;
    }
    throw new Error(mapped.message);
  }

  const payload = data as {
    action: string;
    status: BookingStatus;
    session_pass_id?: string | null;
  };

  await refreshSessionPassMirror(orgId!);

  return applyRpcResultToLocalMirror(existing, {
    status: payload.status || status,
    session_pass_id: payload.session_pass_id,
  });
}
