/**
 * 업종 sync capability — Adapter가 업종 이름을 직접 분기하지 않는지.
 * 실행: npm run test:industry-sync-registry
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '../..');

function run() {
  const adapter = readFileSync(join(here, 'supabaseAdapter.ts'), 'utf8');
  assert.match(adapter, /resolveIndustryHydrateCapabilities/);
  assert.match(adapter, /persistRegisteredCapabilities/);
  assert.doesNotMatch(adapter, /hydratePianoEntities/);
  assert.doesNotMatch(adapter, /hydrateEducationEntities/);
  assert.doesNotMatch(adapter, /hydrateDaycareEntities/);
  assert.doesNotMatch(adapter, /persistPianoEntity/);
  assert.doesNotMatch(adapter, /persistDaycareEntity/);
  assert.doesNotMatch(adapter, /modules\.piano/);
  assert.doesNotMatch(adapter, /PIANO_SYNC_KEYS/);
  assert.doesNotMatch(adapter, /DAYCARE_SYNC_KEYS/);
  assert.doesNotMatch(adapter, /industry === ['"]piano['"]/);
  assert.doesNotMatch(adapter, /bath/i);

  const registry = readFileSync(join(here, 'industrySyncRegistry.ts'), 'utf8');
  assert.match(registry, /registerIndustrySyncCapability/);
  assert.match(registry, /syncCapabilities/);
  assert.match(registry, /id: 'piano'/);
  assert.match(registry, /id: 'education'/);
  assert.match(registry, /id: 'daycare'/);

  const pianoPlugin = readFileSync(join(srcRoot, 'industries/piano/plugin.ts'), 'utf8');
  assert.match(pianoPlugin, /syncCapabilities:\s*\[\s*'piano',\s*'education'\s*\]/);

  const daycarePlugin = readFileSync(join(srcRoot, 'industries/daycare/plugin.ts'), 'utf8');
  assert.match(daycarePlugin, /syncCapabilities:\s*\[\s*'daycare'\s*\]/);

  const pilatesPlugin = readFileSync(join(srcRoot, 'industries/pilates/plugin.ts'), 'utf8');
  assert.doesNotMatch(pilatesPlugin, /syncCapabilities/);

  const pluginTypes = readFileSync(join(srcRoot, 'core/industry/pluginTypes.ts'), 'utf8');
  assert.match(pluginTypes, /syncCapabilities\?:/);

  /**
   * Bath 추가 시 Adapter.ts 수정이 필요 없다.
   * 필요한 것: plugin.syncCapabilities + registerIndustrySyncCapability.
   */
  const bathWouldNeed = [
    'industries/bath/plugin.ts (syncCapabilities: [\'bath\'])',
    'industrySyncRegistry.registerIndustrySyncCapability({ id: \'bath\', ... })',
  ];
  assert.equal(
    adapter.includes('hydrateBath') || adapter.includes('modules.bath'),
    false,
    `Bath를 Adapter에 넣으면 안 됩니다. 대신: ${bathWouldNeed.join(' / ')}`
  );

  console.log('industrySyncRegistry.test.ts: ok');
}

run();
