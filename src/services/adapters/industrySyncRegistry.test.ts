/**
 * 업종 sync capability — Adapter가 업종 이름을 직접 분기하지 않는지.
 * 실행: npm run test:industry-sync-registry
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getIndustrySyncCapability,
  persistRegisteredCapabilities,
  registerIndustrySyncCapability,
  resolveIndustryHydrateCapabilities,
  unregisterIndustrySyncCapability,
} from './industrySyncRegistry';
import type { StorageKey } from './storageKeys';
import type { SyncCache } from './sync/syncTypes';

const here = dirname(fileURLToPath(import.meta.url));
const srcRoot = join(here, '../..');

async function run() {
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
  assert.match(registry, /unregisterIndustrySyncCapability/);
  assert.match(registry, /getIndustrySyncCapability/);
  assert.match(registry, /listIndustrySyncCapabilities/);
  assert.match(registry, /resolveIndustryHydrateCapabilities/);
  assert.match(registry, /persistRegisteredCapabilities/);
  assert.match(registry, /syncCapabilities/);
  assert.match(registry, /getIndustryPlugin\(industryType\)\.syncCapabilities/);
  assert.match(registry, /persistKeys\.has\(key\)/);
  assert.doesNotMatch(registry, /pianoEntitySync/);
  assert.doesNotMatch(registry, /educationEntitySync/);
  assert.doesNotMatch(registry, /daycareEntitySync/);
  assert.doesNotMatch(registry, /PIANO_SYNC_KEYS/);
  assert.doesNotMatch(registry, /DAYCARE_SYNC_KEYS/);
  assert.doesNotMatch(registry, /registerIndustrySyncCapability\(\{[\s\S]*?id:\s*'piano'/);
  assert.doesNotMatch(registry, /registerIndustrySyncCapability\(\{[\s\S]*?id:\s*'education'/);
  assert.doesNotMatch(registry, /registerIndustrySyncCapability\(\{[\s\S]*?id:\s*'daycare'/);

  const pianoPlugin = readFileSync(join(srcRoot, 'industries/piano/plugin.ts'), 'utf8');
  assert.match(pianoPlugin, /syncCapabilities:\s*\[\s*'piano',\s*'education'\s*\]/);

  const daycarePlugin = readFileSync(join(srcRoot, 'industries/daycare/plugin.ts'), 'utf8');
  assert.match(daycarePlugin, /syncCapabilities:\s*\[\s*'daycare'\s*\]/);

  const pilatesPlugin = readFileSync(join(srcRoot, 'industries/pilates/plugin.ts'), 'utf8');
  assert.doesNotMatch(pilatesPlugin, /syncCapabilities/);

  const pluginTypes = readFileSync(join(srcRoot, 'core/industry/pluginTypes.ts'), 'utf8');
  assert.match(pluginTypes, /syncCapabilities\?:/);

  const probeId = '__industry_sync_probe__';
  const probeKey = '__probe_key__' as StorageKey;
  const cache: SyncCache = {
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
    has: () => false,
  };
  let persistCalls = 0;
  registerIndustrySyncCapability({
    id: probeId,
    hydrate: async () => undefined,
    persist: async () => {
      persistCalls += 1;
      return true;
    },
    persistKeys: new Set([probeKey]),
  });
  assert.equal(getIndustrySyncCapability(probeId)?.id, probeId);
  registerIndustrySyncCapability({
    id: probeId,
    hydrate: async () => undefined,
    persist: async () => {
      persistCalls += 10;
      return true;
    },
    persistKeys: new Set([probeKey]),
  });
  assert.equal(typeof resolveIndustryHydrateCapabilities, 'function');

  /**
   * Bath 추가 시 Adapter.ts 수정이 필요 없다.
   * 필요한 것: plugin.syncCapabilities + registerIndustrySyncCapability.
   */
  const bathWouldNeed = [
    'industries/bath/plugin.ts (syncCapabilities: [\'bath\'])',
    'registerIndustrySyncCapability({ id: \'bath\', ... })',
  ];
  assert.equal(
    adapter.includes('hydrateBath') || adapter.includes('modules.bath'),
    false,
    `Bath를 Adapter에 넣으면 안 됩니다. 대신: ${bathWouldNeed.join(' / ')}`
  );

  const persistOk = await persistRegisteredCapabilities(probeKey, 'org', cache, () => false);
  assert.equal(persistOk, true);
  assert.equal(persistCalls, 10);
  unregisterIndustrySyncCapability(probeId);
  assert.equal(getIndustrySyncCapability(probeId), undefined);

  console.log('industrySyncRegistry.test.ts: ok');
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
