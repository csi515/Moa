/**
 * 이용권·예약 상태 전이 규칙 unit test
 * 실행: npm run test:session-pass-booking-rules
 */
import assert from 'node:assert/strict';
import type { Booking, SessionPass } from '@/core/types/schedule';
import {
  applyConsumeToPassList,
  applyRefundToPassList,
  deriveSessionPassStatus,
  hasNonCancelledPassEntitlement,
} from './sessionPassRules';
import { planBookingPassTransition } from './bookingStatusTransition';

function pass(partial: Partial<SessionPass> & Pick<SessionPass, 'id' | 'customerId'>): SessionPass {
  return {
    totalSessions: 10,
    usedSessions: 0,
    status: 'active',
    purchasedAt: '2026-01-01',
    ...partial,
  } as SessionPass;
}

function booking(partial: Partial<Booking> & Pick<Booking, 'id' | 'status'>): Booking {
  return {
    customerId: 'c1',
    customerName: '회원',
    startsAt: '2026-09-22T10:00:00',
    endsAt: '2026-09-22T11:00:00',
    ...partial,
  } as Booking;
}

async function run() {
  assert.equal(deriveSessionPassStatus({ status: 'active', totalSessions: 5, usedSessions: 5 }), 'exhausted');
  assert.equal(deriveSessionPassStatus({ status: 'cancelled', totalSessions: 5, usedSessions: 0 }), 'cancelled');
  assert.equal(deriveSessionPassStatus({ status: 'active', totalSessions: 5, usedSessions: 1 }), 'active');

  const list = [
    pass({ id: 'p1', customerId: 'c1', usedSessions: 9, totalSessions: 10 }),
    pass({ id: 'p2', customerId: 'c1', usedSessions: 0, totalSessions: 5, expiresAt: '2026-12-01' }),
  ];
  assert.equal(hasNonCancelledPassEntitlement(list, 'c1'), true);

  const consumed = applyConsumeToPassList(list, 'c1');
  assert.ok(consumed);
  assert.equal(consumed!.passId, 'p2'); // 만료 임박·잔여 적은 쪽 우선이지만 expires 있는 p2
  assert.equal(consumed!.list.find((p) => p.id === 'p2')!.usedSessions, 1);

  const exhaustedFirst = applyConsumeToPassList(
    [pass({ id: 'p1', customerId: 'c1', usedSessions: 9, totalSessions: 10 })],
    'c1'
  );
  assert.ok(exhaustedFirst);
  assert.equal(exhaustedFirst!.list[0].status, 'exhausted');
  assert.equal(exhaustedFirst!.list[0].usedSessions, 10);

  const refunded = applyRefundToPassList(exhaustedFirst!.list, 'p1');
  assert.equal(refunded.ok, true);
  assert.equal(refunded.list[0].usedSessions, 9);
  assert.equal(refunded.list[0].status, 'active');

  assert.equal(
    planBookingPassTransition(booking({ id: 'b1', status: 'scheduled' }), 'completed').action,
    'consume'
  );
  assert.equal(
    planBookingPassTransition(
      booking({ id: 'b1', status: 'completed', sessionPassId: 'p1' }),
      'cancelled'
    ).action,
    'refund'
  );
  assert.equal(
    planBookingPassTransition(booking({ id: 'b1', status: 'scheduled' }), 'no_show', {
      consumeOnNoShow: true,
    }).action,
    'consume'
  );
  assert.equal(
    planBookingPassTransition(booking({ id: 'b1', status: 'scheduled' }), 'no_show').action,
    'none'
  );
  assert.equal(
    planBookingPassTransition(
      booking({ id: 'b1', status: 'completed', sessionPassId: 'p1' }),
      'completed'
    ).action,
    'keep'
  );

  // 이용권 있으나 잔여 0 → consume null, entitlement true
  const noRemain = applyConsumeToPassList(
    [pass({ id: 'p1', customerId: 'c1', usedSessions: 10, totalSessions: 10, status: 'exhausted' })],
    'c1'
  );
  assert.equal(noRemain, null);
  assert.equal(
    hasNonCancelledPassEntitlement(
      [pass({ id: 'p1', customerId: 'c1', usedSessions: 10, totalSessions: 10, status: 'exhausted' })],
      'c1'
    ),
    true
  );

  console.log('sessionPassBookingRules.test.ts: ok');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
