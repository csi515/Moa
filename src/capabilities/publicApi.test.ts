/**
 * Capability root index가 공식 public API인지 확인.
 * 실행: npx tsx src/capabilities/publicApi.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attendanceCapability } from './attendance/manifest';
import { billingCapability } from './billing/manifest';
import { bookingCapability } from './booking/manifest';
import { commerceCapability } from './commerce/manifest';
import { schedulingCapability } from './scheduling/manifest';

const here = dirname(fileURLToPath(import.meta.url));

function readCap(id: string): string {
  return readFileSync(join(here, id, 'index.ts'), 'utf8');
}

function run(): void {
  assert.equal(attendanceCapability.definition.id, 'attendance');
  assert.equal(billingCapability.definition.id, 'billing');
  assert.equal(commerceCapability.definition.id, 'commerce');
  assert.equal(schedulingCapability.definition.id, 'scheduling');
  assert.equal(bookingCapability.definition.id, 'booking');

  const billing = readCap('billing');
  assert.match(billing, /from '\.\/finance'/);
  assert.doesNotMatch(billing, /createBillingCapabilityStorage/);

  const commerce = readCap('commerce');
  assert.match(commerce, /from '\.\/facade'/);
  assert.match(commerce, /from '\.\/loyalty'/);
  assert.doesNotMatch(commerce, /from '\.\/saleLedger'/);
  assert.doesNotMatch(commerce, /createCommerceCapabilityStorage/);

  const scheduling = readCap('scheduling');
  assert.match(scheduling, /from '\.\/availability'/);
  assert.match(scheduling, /from '\.\/capacity'/);
  assert.match(scheduling, /from '\.\/calendar'/);

  const booking = readCap('booking');
  assert.match(booking, /from '\.\/waitlist'/);
  assert.doesNotMatch(booking, /createBookingCapabilityStorage/);

  const attendance = readCap('attendance');
  assert.match(attendance, /AttendanceManagementView/);
  assert.doesNotMatch(attendance, /createAttendanceCapabilityStorage/);

  console.log('publicApi.test.ts: ok');
}

run();
