/**
 * 예약 상태 + 이용권 원자 RPC 계약·멱등·롤백 모델 단위 테스트
 * 실행: npm run test:booking-pass-atomic
 *
 * 실제 DB TX는 core.update_booking_status_with_pass(FOR UPDATE)가 담당.
 */
import assert from 'node:assert/strict';
import { mapBookingPassRpcError } from './mapBookingPassRpcError';
import { planBookingPassTransition } from './bookingStatusTransition';
import {
  applyConsumeToPassList,
  applyRefundToPassList,
  hasNonCancelledPassEntitlement,
} from './sessionPassRules';
import type { Booking, SessionPass } from '@/core/types/schedule';

type PassState = { used: number; status: string };
type BookingState = { status: string; passId: string | null };

/**
 * RPC 원자성 모델:
 * shortfall이면 booking/pass 모두 미반영.
 * EXCEPTION이면 전체 rollback.
 */
function modelAtomicStatusChange(input: {
  booking: BookingState;
  pass: PassState | null;
  hasEntitlement: boolean;
  newStatus: string;
  consumeOnNoShow?: boolean;
  failMidway?: boolean;
}): { booking: BookingState; pass: PassState | null; ok: boolean; action: string } {
  const deducting =
    input.newStatus === 'completed' ||
    (input.consumeOnNoShow === true && input.newStatus === 'no_show');
  const wasDeducting =
    input.booking.status === 'completed' ||
    (input.booking.status === 'no_show' && Boolean(input.booking.passId));

  if (input.booking.status === input.newStatus) {
    return { booking: input.booking, pass: input.pass, ok: true, action: 'idempotent' };
  }

  let booking = { ...input.booking };
  let pass = input.pass ? { ...input.pass } : null;
  let action = 'none';

  if (deducting && !wasDeducting && !booking.passId) {
    if (!pass || pass.status !== 'active' || pass.used >= 10) {
      if (input.hasEntitlement) {
        return { booking: input.booking, pass: input.pass, ok: false, action: 'blocked' };
      }
      booking = { ...booking, status: input.newStatus };
      return { booking, pass, ok: true, action: 'none' };
    }
    if (input.failMidway) {
      return { booking: input.booking, pass: input.pass, ok: false, action: 'rollback' };
    }
    pass = {
      used: pass.used + 1,
      status: pass.used + 1 >= 10 ? 'exhausted' : 'active',
    };
    booking = { status: input.newStatus, passId: 'p1' };
    action = 'consume';
  } else if (wasDeducting && !deducting && booking.passId) {
    if (input.failMidway) {
      return { booking: input.booking, pass: input.pass, ok: false, action: 'rollback' };
    }
    if (pass && pass.status !== 'cancelled') {
      const used = Math.max(0, pass.used - 1);
      pass = { used, status: used >= 10 ? 'exhausted' : 'active' };
    }
    booking = { status: input.newStatus, passId: null };
    action = 'refund';
  } else {
    booking = { ...booking, status: input.newStatus };
    action = 'keep';
  }

  return { booking, pass, ok: true, action };
}

function simulateSerialized(
  initial: { booking: BookingState; pass: PassState },
  requests: string[]
): { finals: BookingState[]; passUsed: number } {
  let booking = { ...initial.booking };
  let pass = { ...initial.pass };
  const finals: BookingState[] = [];
  for (const status of requests) {
    const r = modelAtomicStatusChange({
      booking,
      pass,
      hasEntitlement: true,
      newStatus: status,
      consumeOnNoShow: true,
    });
    if (r.ok) {
      booking = r.booking;
      if (r.pass) pass = r.pass;
    }
    finals.push({ ...booking });
  }
  return { finals, passUsed: pass.used };
}

async function run() {
  // ── [예약/이용권] Atomicity: 정상 완료 1회 → 차감 1회 ───────────
  {
    const r = modelAtomicStatusChange({
      booking: { status: 'scheduled', passId: null },
      pass: { used: 0, status: 'active' },
      hasEntitlement: true,
      newStatus: 'completed',
    });
    assert.equal(r.ok, true);
    assert.equal(r.action, 'consume');
    assert.equal(r.booking.status, 'completed');
    assert.equal(r.pass?.used, 1);
  }

  // ── [예약/이용권] Consistency: 이용권 부족 → 완료 실패·상태 유지 ─
  {
    const r = modelAtomicStatusChange({
      booking: { status: 'scheduled', passId: null },
      pass: { used: 10, status: 'exhausted' },
      hasEntitlement: true,
      newStatus: 'completed',
    });
    assert.equal(r.ok, false);
    assert.equal(r.booking.status, 'scheduled');
    assert.equal(r.pass?.used, 10);
  }

  // ── [예약/이용권] Consistency: 완료 취소 1회 → 복구 1회 ─────────
  {
    const r = modelAtomicStatusChange({
      booking: { status: 'completed', passId: 'p1' },
      pass: { used: 3, status: 'active' },
      hasEntitlement: true,
      newStatus: 'cancelled',
    });
    assert.equal(r.ok, true);
    assert.equal(r.action, 'refund');
    assert.equal(r.booking.passId, null);
    assert.equal(r.pass?.used, 2);
  }

  // no_show
  {
    const r = modelAtomicStatusChange({
      booking: { status: 'confirmed', passId: null },
      pass: { used: 1, status: 'active' },
      hasEntitlement: true,
      newStatus: 'no_show',
      consumeOnNoShow: true,
    });
    assert.equal(r.action, 'consume');
    assert.equal(r.booking.status, 'no_show');
  }

  // ── [예약/이용권] Idempotency: 동일 완료 2회 → 추가 차감 없음 ───
  {
    const r = modelAtomicStatusChange({
      booking: { status: 'completed', passId: 'p1' },
      pass: { used: 2, status: 'active' },
      hasEntitlement: true,
      newStatus: 'completed',
    });
    assert.equal(r.action, 'idempotent');
    assert.equal(r.pass?.used, 2);
  }

  // ── [예약/이용권] Isolation: 동시 완료 2회 → 차감 1회 ───────────
  {
    const sim = simulateSerialized(
      { booking: { status: 'scheduled', passId: null }, pass: { used: 0, status: 'active' } },
      ['completed', 'completed']
    );
    assert.equal(sim.passUsed, 1);
    assert.equal(sim.finals[1].status, 'completed');
  }

  // ── [예약/이용권] Atomicity: 중간 실패 → 전체 rollback ──────────
  {
    const r = modelAtomicStatusChange({
      booking: { status: 'scheduled', passId: null },
      pass: { used: 0, status: 'active' },
      hasEntitlement: true,
      newStatus: 'completed',
      failMidway: true,
    });
    assert.equal(r.ok, false);
    assert.equal(r.action, 'rollback');
    assert.equal(r.booking.status, 'scheduled');
    assert.equal(r.pass?.used, 0);
  }

  // org mismatch / errors mapping
  {
    assert.equal(mapBookingPassRpcError({ message: 'Organization mismatch' }).code, 'org_mismatch');
    assert.equal(mapBookingPassRpcError({ message: 'Insufficient session pass' }).code, 'insufficient_pass');
    assert.equal(mapBookingPassRpcError({ message: 'Booking not found' }).code, 'not_found');
    assert.equal(mapBookingPassRpcError({ message: 'Permission denied' }).code, 'permission');
  }

  // pure list ops still consistent with plan
  {
    const passes: SessionPass[] = [
      {
        id: 'p1',
        customerId: 'c1',
        customerName: 'A',
        label: '10회',
        totalSessions: 10,
        usedSessions: 9,
        status: 'active',
        purchasedAt: '2026-01-01',
      },
    ];
    assert.equal(hasNonCancelledPassEntitlement(passes, 'c1'), true);
    const consumed = applyConsumeToPassList(passes, 'c1');
    assert.ok(consumed);
    const refunded = applyRefundToPassList(consumed!.list, 'p1');
    assert.equal(refunded.list[0].usedSessions, 9);

    const booking = {
      id: 'b1',
      customerId: 'c1',
      customerName: 'A',
      startsAt: '2026-09-22T10:00:00',
      endsAt: '2026-09-22T11:00:00',
      status: 'scheduled',
    } as Booking;
    assert.equal(planBookingPassTransition(booking, 'completed').action, 'consume');
  }

  console.log('bookingPassAtomic.test.ts: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
