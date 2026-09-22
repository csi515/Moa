/**
 * hydrate 모듈 선택 — industry별 Core + 모듈 조합
 * 실행: npm run test:hydrate-modules
 */
import assert from 'node:assert/strict';
import { resolveHydrateModules } from './hydrateModules';

const cases: Array<{
  industry: string | null;
  expect: { piano: boolean; education: boolean; daycare: boolean };
}> = [
  { industry: 'piano', expect: { piano: true, education: true, daycare: false } },
  { industry: 'daycare', expect: { piano: false, education: false, daycare: true } },
  { industry: 'preschool', expect: { piano: false, education: false, daycare: true } },
  { industry: 'retail', expect: { piano: false, education: false, daycare: false } },
  { industry: 'pilates', expect: { piano: false, education: false, daycare: false } },
  { industry: 'gym', expect: { piano: false, education: false, daycare: false } },
  { industry: 'skin_clinic', expect: { piano: false, education: false, daycare: false } },
  // unknown → normalize → piano (기존 기본값)
  { industry: null, expect: { piano: true, education: true, daycare: false } },
];

for (const { industry, expect } of cases) {
  const actual = resolveHydrateModules(industry);
  assert.deepEqual(actual, expect, `${industry}`);
}

console.log('hydrateModules.test.ts: ok');
