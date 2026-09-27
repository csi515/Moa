/**
 * 업종 sync capability — Adapter가 업종 이름을 직접 분기하지 않는지.
 * 실행: npm run test:industry-sync-registry
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { installIndustryPlugin } from '@/core/industry/pluginHost';
import {
  collectIndustryRegistrationGaps,
  readIndustryRegistrationSnapshot,
} from '@/core/industry/industryRegistrationIntegrity';
import type { IndustryPluginManifest } from '@/core/industry/pluginTypes';
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

function readSrc(...parts: string[]) {
  return readFileSync(join(srcRoot, ...parts), 'utf8');
}

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
  assert.doesNotMatch(registry, /@\/industries/);
  assert.doesNotMatch(registry, /registerIndustrySyncCapability\(\{[\s\S]*?id:\s*'piano'/);
  assert.doesNotMatch(registry, /registerIndustrySyncCapability\(\{[\s\S]*?id:\s*'education'/);
  assert.doesNotMatch(registry, /registerIndustrySyncCapability\(\{[\s\S]*?id:\s*'daycare'/);

  assert.doesNotMatch(readSrc('services/adapters/sync/pianoEntitySync.ts'), /registerIndustrySyncCapability/);
  assert.doesNotMatch(readSrc('services/adapters/sync/educationEntitySync.ts'), /registerIndustrySyncCapability/);
  assert.doesNotMatch(readSrc('services/adapters/sync/daycareEntitySync.ts'), /registerIndustrySyncCapability/);

  const pianoPlugin = readSrc('industries/piano/plugin.ts');
  assert.match(pianoPlugin, /syncCapabilities:\s*\[\s*'piano',\s*'education'\s*\]/);
  assert.match(pianoPlugin, /registerPianoSync/);
  assert.match(pianoPlugin, /registerEducationSync/);

  const daycarePlugin = readSrc('industries/daycare/plugin.ts');
  assert.match(daycarePlugin, /syncCapabilities:\s*\[\s*'daycare'\s*\]/);
  assert.match(daycarePlugin, /registerDaycareSync/);

  const pilatesPlugin = readSrc('industries/pilates/plugin.ts');
  assert.doesNotMatch(pilatesPlugin, /syncCapabilities/);

  const pluginTypes = readSrc('core/industry/pluginTypes.ts');
  assert.match(pluginTypes, /syncCapabilities\?:/);

  const pianoReg = readSrc('industries/piano/sync/registerPianoSync.ts');
  assert.match(pianoReg, /registerIndustrySyncCapability/);
  assert.match(pianoReg, /id:\s*'piano'/);
  assert.match(pianoReg, /hydratePianoEntities/);
  assert.match(pianoReg, /persistPianoEntity/);
  assert.match(pianoReg, /PIANO_SYNC_KEYS/);

  const educationReg = readSrc('industries/piano/sync/registerEducationSync.ts');
  assert.match(educationReg, /registerIndustrySyncCapability/);
  assert.match(educationReg, /id:\s*'education'/);
  assert.match(educationReg, /hydrateEducationEntities/);
  assert.match(educationReg, /persistEducationEntity/);
  assert.match(educationReg, /PIANO_SYNC_KEYS/);

  const daycareReg = readSrc('industries/daycare/sync/registerDaycareSync.ts');
  assert.match(daycareReg, /registerIndustrySyncCapability/);
  assert.match(daycareReg, /id:\s*'daycare'/);
  assert.match(daycareReg, /hydrateDaycareEntities/);
  assert.match(daycareReg, /persistDaycareEntity/);
  assert.match(daycareReg, /DAYCARE_SYNC_KEYS/);

  const snap = readIndustryRegistrationSnapshot(srcRoot);
  assert.ok(snap.registeredCapabilities.includes('piano'));
  assert.ok(snap.registeredCapabilities.includes('education'));
  assert.ok(snap.registeredCapabilities.includes('daycare'));
  assert.match(
    collectIndustryRegistrationGaps({
      ...snap,
      pluginRecords: snap.pluginRecords.map((rec) =>
        rec.id === 'piano'
          ? { ...rec, syncCapabilities: [...rec.syncCapabilities, 'bath'] }
          : rec
      ),
    }).join('\n'),
    /capability 선언 누락: plugin piano syncCapabilities "bath"/
  );

  const probePlugin: IndustryPluginManifest = {
    id: 'piano',
    option: { value: 'piano', label: 'probe', description: 'probe' },
    theme: 'indigo',
    accent: { btn: '', btnHover: '', icon: '', hoverBg: '', ring: '' },
    attendanceDefault: false,
    usesClassBasedSchedule: true,
    customerListTab: 'students',
    showSchoolFields: true,
    showPickupFields: false,
    levelLabel: '레벨',
    adminTabs: [],
    staffTabs: [],
    syncCapabilities: ['piano', 'education'],
  };
  installIndustryPlugin(probePlugin);
  installIndustryPlugin({
    ...probePlugin,
    id: 'daycare',
    option: { value: 'daycare', label: 'probe', description: 'probe' },
    syncCapabilities: ['daycare'],
  });
  installIndustryPlugin({
    ...probePlugin,
    id: 'pilates',
    option: { value: 'pilates', label: 'probe', description: 'probe' },
    syncCapabilities: undefined,
  });

  const stub = {
    hydrate: async () => undefined,
    persist: async () => true,
    persistKeys: new Set<StorageKey>(),
  };
  registerIndustrySyncCapability({ id: 'piano', ...stub });
  registerIndustrySyncCapability({ id: 'education', ...stub });
  registerIndustrySyncCapability({ id: 'daycare', ...stub });
  assert.deepEqual(
    resolveIndustryHydrateCapabilities('piano').map((cap) => cap.id),
    ['piano', 'education']
  );
  assert.deepEqual(
    resolveIndustryHydrateCapabilities('daycare').map((cap) => cap.id),
    ['daycare']
  );
  assert.deepEqual(resolveIndustryHydrateCapabilities('pilates').map((cap) => cap.id), []);

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

  /**
   * Bath 추가 시 Adapter·registry 수정이 필요 없다.
   * 필요한 것: plugin.syncCapabilities + industries/<id>/sync/register*Sync.ts
   */
  const bathWouldNeed = [
    'industries/bath/plugin.ts (syncCapabilities: [\'bath\'])',
    'industries/bath/sync/registerBathSync.ts → registerIndustrySyncCapability',
  ];
  assert.equal(
    adapter.includes('hydrateBath') || adapter.includes('modules.bath'),
    false,
    `Bath를 Adapter에 넣으면 안 됩니다. 대신: ${bathWouldNeed.join(' / ')}`
  );
  assert.doesNotMatch(
    registry,
    /registerBathSync|id:\s*'bath'/,
    '새 sync capability는 registry를 수정하지 않는다'
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
