/**
 * Industry definition ↔ composition module 단일 출처 패리티.
 * 실행: npm run test:industry-manifest
 */
import assert from 'node:assert/strict';
import {
  INDUSTRY_ALIASES,
  INDUSTRY_IDS,
  MODULE_INDUSTRY_IDS,
  PUBLIC_SELECTABLE_INDUSTRY_IDS,
  getIndustryDefinition,
  listIndustryDefinitions,
} from '@/core/industry/catalog';
import { defineIndustry } from '@/core/industry/definitions';
import {
  assertIndustryRegistrationIntegrity,
  readIndustryRegistrationSnapshot,
} from '@/core/industry/industryRegistrationIntegrity';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const EXPECTED_MODULE_IDS = [
  'piano',
  'pilates',
  'gym',
  'daycare',
  'skin_clinic',
  'retail',
  'sauna_jjimjilbang',
] as const;

function run(): void {
  const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
  assertIndustryRegistrationIntegrity(srcRoot);

  const snap = readIndustryRegistrationSnapshot(srcRoot);
  const moduleIds = [...snap.moduleIds].sort();
  assert.deepEqual(moduleIds, [...MODULE_INDUSTRY_IDS].sort());
  assert.deepEqual(moduleIds, [...EXPECTED_MODULE_IDS].sort());
  assert.deepEqual([...snap.registryPluginIds].sort(), moduleIds);
  assert.deepEqual([...snap.routerKeys].sort(), moduleIds);
  assert.deepEqual([...snap.pluginIds].sort(), moduleIds);

  const unique = new Set(INDUSTRY_IDS);
  assert.equal(unique.size, INDUSTRY_IDS.length, 'industry id must be unique');

  const moduleIdSet = new Set(moduleIds);
  assert.equal(moduleIdSet.size, moduleIds.length, 'module id must be unique');

  for (const id of MODULE_INDUSTRY_IDS) {
    const def = getIndustryDefinition(id);
    assert.ok(def, `definition missing: ${id}`);
    assert.equal(def.moduleId, id);
    assert.ok(snap.routerKeys.includes(id), `router registration missing: ${id}`);
    assert.ok(snap.registryPluginIds.includes(id), `module registration missing: ${id}`);
  }

  const selectable = listIndustryDefinitions({ selectableOnly: true }).map((d) => d.id).sort();
  assert.deepEqual(selectable, [...PUBLIC_SELECTABLE_INDUSTRY_IDS].sort());
  assert.deepEqual(selectable, [...EXPECTED_MODULE_IDS].sort());

  for (const id of PUBLIC_SELECTABLE_INDUSTRY_IDS) {
    assert.equal(getIndustryDefinition(id)?.selectable, true);
    assert.ok(MODULE_INDUSTRY_IDS.includes(id), `selectable industry has no module: ${id}`);
  }

  assert.equal(getIndustryDefinition('taekwondo')?.id, 'gym');
  assert.equal(getIndustryDefinition('preschool')?.id, 'daycare');
  assert.equal(getIndustryDefinition('kindergarten')?.id, 'daycare');
  assert.equal(getIndustryDefinition('sauna_jjimjbang')?.id, 'sauna_jjimjilbang');
  assert.equal(INDUSTRY_ALIASES.taekwondo, 'gym');
  assert.equal(INDUSTRY_ALIASES.preschool, 'daycare');
  assert.equal(INDUSTRY_ALIASES.kindergarten, 'daycare');
  assert.equal(INDUSTRY_ALIASES.sauna_jjimjbang, 'sauna_jjimjilbang');

  const gymAliases = snap.pluginRecords.find((r) => r.id === 'gym')?.aliases ?? [];
  assert.ok(gymAliases.includes('taekwondo'));

  const piano = defineIndustry('piano', '피아노학원', 'test', 'education', 'piano');
  assert.equal(piano.id, 'piano');
  assert.equal(piano.moduleId, 'piano');

  console.log(`industryManifest.parity.test.ts OK (${moduleIds.length} modules)`);
}

run();
