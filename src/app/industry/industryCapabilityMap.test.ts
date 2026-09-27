/**
 * Industry capability map 타입. 실행: npx tsx src/app/industry/industryCapabilityMap.test.ts
 */
import assert from 'node:assert/strict';
import type { IndustryCapabilityFlagMap } from './industryCapabilityMap';

const allowed: IndustryCapabilityFlagMap = {
  attendance: true,
  billing: false,
  commerce: true,
  scheduling: true,
  booking: true,
  parent: true,
  resources: true,
  transport: true,
  roster: true,
  enrollment: true,
  consultation: true,
};

// @ts-expect-error 허용되지 않은 capability id
const unknownKey: IndustryCapabilityFlagMap = { attendnce: true };

function run(): void {
  assert.equal(allowed.attendance, true);
  assert.equal(unknownKey.attendance, undefined);
  console.log('industryCapabilityMap.test.ts: ok');
}

run();
