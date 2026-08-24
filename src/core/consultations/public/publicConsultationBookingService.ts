import { getCoreClient } from '@/lib/supabase';
import {
  DEFAULT_CONSULTATION_BOOKING_SETTINGS,
  type ConsultationBookingSettings,
  type PublicConsultationBookingContext,
} from '../types';

interface RpcContextRow {
  error?: string;
  organizationId?: string;
  organizationName?: string;
  settings?: Partial<ConsultationBookingSettings>;
  bookedSlots?: { date: string; time: string }[];
}

interface RpcSubmitRow {
  error?: string;
  success?: boolean;
  id?: string;
}

function normalizeSettings(raw?: Partial<ConsultationBookingSettings>): ConsultationBookingSettings {
  if (!raw) return DEFAULT_CONSULTATION_BOOKING_SETTINGS;
  return {
    ...DEFAULT_CONSULTATION_BOOKING_SETTINGS,
    ...raw,
    weeklyAvailability:
      raw.weeklyAvailability?.length === 7
        ? raw.weeklyAvailability
        : DEFAULT_CONSULTATION_BOOKING_SETTINGS.weeklyAvailability,
    blockedDates: raw.blockedDates ?? [],
  };
}

/** QR 공개 페이지 — org slug로 예약 컨텍스트 조회 */
export async function fetchPublicConsultationBookingContext(
  slug: string
): Promise<PublicConsultationBookingContext | { error: string }> {
  const { data, error } = await getCoreClient().rpc(
    'public_get_consultation_booking_context' as never,
    { p_slug: slug } as never
  );

  if (error) {
    console.error('public_get_consultation_booking_context failed:', error);
    return { error: 'load_failed' };
  }

  const row = data as RpcContextRow | null;
  if (!row || row.error) {
    return { error: row?.error ?? 'not_found' };
  }

  return {
    organizationId: row.organizationId!,
    organizationName: row.organizationName ?? '',
    settings: normalizeSettings(row.settings),
    bookedSlots: row.bookedSlots ?? [],
  };
}

/** QR 공개 페이지 — 상담 예약 제출 */
export async function submitPublicConsultationBooking(input: {
  slug: string;
  name: string;
  phone: string;
  content: string;
  preferredDate: string;
  preferredTime: string;
}): Promise<{ success: true; id: string } | { error: string }> {
  const { data, error } = await getCoreClient().rpc(
    'public_submit_consultation_booking' as never,
    {
      p_slug: input.slug,
      p_name: input.name.trim(),
      p_phone: input.phone.trim(),
      p_content: input.content.trim(),
      p_date: input.preferredDate,
      p_time: input.preferredTime,
    } as never
  );

  if (error) {
    console.error('public_submit_consultation_booking failed:', error);
    return { error: 'submit_failed' };
  }

  const row = data as RpcSubmitRow | null;
  if (!row?.success || !row.id) {
    return { error: row?.error ?? 'submit_failed' };
  }

  return { success: true, id: row.id };
}
