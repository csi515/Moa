/**
 * 딥링크 파서 단위 테스트
 * 실행: npx tsx src/core/platform/deepLinkParser.test.ts
 */
import assert from 'node:assert/strict';
import { parseDeepLinksFromUrl } from './deepLinkParser';

function run(): void {
  const g = parseDeepLinksFromUrl('https://app.example.com/?link=ABC123');
  assert.equal(g.guardianLink, 'ABC123');
  assert.equal(g.staffLink, null);

  const s = parseDeepLinksFromUrl('https://app.example.com/?staff_link=xyz789');
  assert.equal(s.staffLink, 'XYZ789');
  assert.equal(s.guardianLink, null);

  const both = parseDeepLinksFromUrl('https://app.example.com/?link=aa&staff_link=bb');
  assert.equal(both.guardianLink, 'AA');
  assert.equal(both.staffLink, 'BB');

  const bad = parseDeepLinksFromUrl('not-a-url');
  assert.equal(bad.guardianLink, null);
  assert.equal(bad.staffLink, null);

  console.log('deepLinkParser.test.ts: all assertions passed');
}

run();
