/**
 * Idempotency infrastructure + concurrency.
 * 실행: npm run test:idempotency
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  beginIdempotency,
  completeIdempotency,
  failIdempotency,
  runSerializedIdempotentCommands,
} from './evaluate';
import { createHash } from 'node:crypto';
import {
  bookingIdempotencyCanonical,
  paymentIdempotencyCanonical,
} from './hash';

function hashIdempotencyRequest(canonical: string): string {
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}
import { IDEMPOTENCY_OPERATIONS, IDEMPOTENCY_PILOT_OPERATIONS } from './types';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '../../..');

function run() {
  assert.deepEqual([...IDEMPOTENCY_PILOT_OPERATIONS], ['booking', 'payment']);
  assert.equal(IDEMPOTENCY_OPERATIONS.includes('sale'), true);

  const canonical = bookingIdempotencyCanonical({
    organizationId: 'org-a',
    bookingId: 'b1',
    status: 'completed',
    consumeOnNoShow: false,
  });
  assert.equal(canonical, 'org-a:b1:completed:false');
  const hash = hashIdempotencyRequest(canonical);
  assert.equal(hash.length, 64);
  assert.equal(hashIdempotencyRequest(canonical), hash);
  assert.notEqual(
    hashIdempotencyRequest(
      bookingIdempotencyCanonical({
        organizationId: 'org-a',
        bookingId: 'b1',
        status: 'cancelled',
        consumeOnNoShow: false,
      })
    ),
    hash
  );

  let store = new Map();
  const first = beginIdempotency(store, {
    organizationId: 'org-a',
    key: 'k1',
    operation: 'booking',
    requestHash: hash,
  });
  assert.equal(first.result.outcome, 'execute');
  store = first.store;
  store = completeIdempotency(store, 'org-a', 'k1', { action: 'completed' });
  const replay = beginIdempotency(store, {
    organizationId: 'org-a',
    key: 'k1',
    operation: 'booking',
    requestHash: hash,
  });
  assert.equal(replay.result.outcome, 'replay');
  if (replay.result.outcome === 'replay') {
    assert.deepEqual(replay.result.response, { action: 'completed' });
  }

  const mismatch = beginIdempotency(store, {
    organizationId: 'org-a',
    key: 'k1',
    operation: 'booking',
    requestHash: hashIdempotencyRequest('other'),
  });
  assert.equal(mismatch.result.outcome, 'mismatch');

  const otherOrg = beginIdempotency(store, {
    organizationId: 'org-b',
    key: 'k1',
    operation: 'booking',
    requestHash: hash,
  });
  assert.equal(otherOrg.result.outcome, 'execute');

  {
    let effects = 0;
    const effect = () => {
      effects += 1;
      return { n: effects };
    };
    const results = runSerializedIdempotentCommands([
      { organizationId: 'org-a', key: 'pay-1', operation: 'payment', requestHash: 'h', effect },
      { organizationId: 'org-a', key: 'pay-1', operation: 'payment', requestHash: 'h', effect },
    ]);
    assert.equal(effects, 1);
    assert.deepEqual(results[0], { ok: true, value: { n: 1 } });
    assert.deepEqual(results[1], { ok: true, value: { n: 1 } });
  }

  {
    let effects = 0;
    const results = runSerializedIdempotentCommands([
      {
        organizationId: 'org-a',
        key: 'pay-2',
        operation: 'payment',
        requestHash: 'h1',
        effect: () => {
          effects += 1;
          return effects;
        },
      },
      {
        organizationId: 'org-a',
        key: 'pay-2',
        operation: 'payment',
        requestHash: 'h2',
        effect: () => {
          effects += 1;
          return effects;
        },
      },
    ]);
    assert.equal(effects, 1);
    assert.deepEqual(results[1], { ok: false, reason: 'mismatch' });
  }

  {
    let storeFailed = new Map();
    const begun = beginIdempotency(storeFailed, {
      organizationId: 'org-a',
      key: 'fail-1',
      operation: 'payment',
      requestHash: 'h',
    });
    storeFailed = failIdempotency(begun.store, 'org-a', 'fail-1');
    const retry = beginIdempotency(storeFailed, {
      organizationId: 'org-a',
      key: 'fail-1',
      operation: 'payment',
      requestHash: 'h',
    });
    assert.equal(retry.result.outcome, 'execute');
  }

  assert.equal(
    paymentIdempotencyCanonical({
      organizationId: 'org-a',
      invoiceId: 'inv-1',
      amount: 10000,
      method: 'cash',
      paidAt: '2026-09-24',
    }),
    'org-a:inv-1:10000:cash:2026-09-24'
  );

  const sql = readFileSync(
    join(root, 'supabase/migrations/20260924310000_idempotency_infrastructure.sql'),
    'utf8'
  );
  assert.match(sql, /CREATE TABLE core\.idempotency_keys/);
  assert.match(sql, /UNIQUE \(organization_id, key\)/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /FOR UPDATE/);
  assert.match(sql, /Idempotency payload mismatch/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION core\.begin_idempotency/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION core\.complete_idempotency/);
  assert.match(sql, /CREATE OR REPLACE FUNCTION core\.fail_idempotency/);
  assert.match(sql, /update_booking_status_with_pass_idempotent/);
  assert.match(sql, /record_tuition_payment_idempotent/);
  assert.match(sql, /RETURN core\.update_booking_status_with_pass\(/);
  assert.match(sql, /RETURN core\.record_tuition_payment\(/);
  assert.doesNotMatch(sql, /CREATE OR REPLACE FUNCTION core\.update_booking_status_with_pass\(/);
  assert.doesNotMatch(sql, /CREATE OR REPLACE FUNCTION core\.record_tuition_payment\(/);
  assert.doesNotMatch(sql, /ALTER TABLE core\.(schedules|payments|session_passes)/);

  const bookingClient = readFileSync(
    join(root, 'src/core/schedules/bookingPassAtomic.ts'),
    'utf8'
  );
  assert.match(bookingClient, /update_booking_status_with_pass/);
  assert.match(bookingClient, /update_booking_status_with_pass_idempotent/);

  const tuitionClient = readFileSync(
    join(root, 'src/core/finance/tuitionPaymentAtomic.ts'),
    'utf8'
  );
  assert.match(tuitionClient, /record_tuition_payment_idempotent/);
  assert.match(tuitionClient, /p_idempotency_key/);

  console.log('idempotencyCapability.test.ts: ok');
}

run();
