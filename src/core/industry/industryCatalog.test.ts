/**
 * Industry 카탈로그 불변조건.
 * 실행: npx tsx src/core/industry/industryCatalog.test.ts
 */
import assert from 'node:assert/strict';
import {
  INDUSTRY_IDS,
  INDUSTRY_DEFINITIONS,
  INDUSTRY_ALIASES,
  MODULE_INDUSTRY_IDS,
  isIndustryType,
  listIndustryDefinitions,
  listIndustriesByCategory,
  hasIndustryModule,
  getIndustryDefinition,
  shouldUseGenericShell,
} from './catalog';
import { INDUSTRY_CATEGORY_OPTIONS } from './categories';
import {
  normalizeIndustryType,
  getIndustryLabel,
  assertCatalogIntegrity,
} from './types';

const SUBJECT_ACADEMY_FORBIDDEN = [
  'english_academy',
  'math_academy',
  'korean_academy',
  'science_academy',
  'coding_academy',
  'coding_bootcamp',
] as const;

function run(): void {
  assertCatalogIntegrity();

  for (const id of INDUSTRY_IDS) {
    const def = INDUSTRY_DEFINITIONS[id];
    assert.equal(def.id, id);
    assert.ok(def.label.length > 0);
    assert.ok(INDUSTRY_CATEGORY_OPTIONS.some((c) => c.id === def.category));
  }

  // INDUSTRY_IDS ↔ DEFINITIONS 단일 출처
  assert.equal(INDUSTRY_IDS.length, Object.keys(INDUSTRY_DEFINITIONS).length);

  for (const id of MODULE_INDUSTRY_IDS) {
    assert.ok(isIndustryType(id), `missing module industry: ${id}`);
    assert.equal(INDUSTRY_DEFINITIONS[id].moduleId, id);
    assert.equal(hasIndustryModule(id), true);
    assert.equal(shouldUseGenericShell(id), false);
  }

  assert.ok(isIndustryType('academy'));
  assert.equal(hasIndustryModule('academy'), false);
  assert.equal(shouldUseGenericShell('academy'), true);
  for (const forbidden of SUBJECT_ACADEMY_FORBIDDEN) {
    assert.equal(isIndustryType(forbidden), false, `must not exist: ${forbidden}`);
  }

  assert.equal(normalizeIndustryType('taekwondo'), 'gym');
  assert.equal(normalizeIndustryType('preschool'), 'daycare');
  assert.equal(normalizeIndustryType('kindergarten'), 'daycare');
  assert.equal(INDUSTRY_ALIASES.taekwondo, 'gym');

  assert.equal(normalizeIndustryType('not_a_real_type'), 'piano');
  assert.equal(normalizeIndustryType(null), 'piano');
  assert.equal(shouldUseGenericShell('not_a_real_type'), false);

  assert.equal(normalizeIndustryType('hair_salon'), 'hair_salon');
  assert.equal(normalizeIndustryType('academy'), 'academy');
  assert.ok(getIndustryLabel('hair_salon').length > 0);
  assert.ok(getIndustryLabel('piano').includes('피아노'));

  const education = listIndustriesByCategory('education');
  assert.ok(education.some((d) => d.id === 'piano'));
  assert.ok(education.some((d) => d.id === 'academy'));
  assert.ok(!education.some((d) => d.id === 'pilates'));

  const selectable = listIndustryDefinitions({ selectableOnly: true });
  assert.equal(selectable.length, INDUSTRY_IDS.length);

  assert.equal(getIndustryDefinition('taekwondo')?.id, 'gym');
  assert.equal(getIndustryDefinition('piano')?.moduleId, 'piano');
  assert.equal(getIndustryDefinition('academy')?.moduleId, undefined);

  for (const cat of INDUSTRY_CATEGORY_OPTIONS) {
    const items = listIndustriesByCategory(cat.id);
    assert.ok(items.length > 0, `empty category: ${cat.id}`);
  }

  console.log(`industryCatalog.test.ts OK (${INDUSTRY_IDS.length} industries)`);
}

run();
