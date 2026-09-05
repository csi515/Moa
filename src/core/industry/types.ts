import {
  INDUSTRY_ALIASES,
  INDUSTRY_DEFINITIONS,
  INDUSTRY_IDS,
  getIndustryDefinition,
  isIndustryType,
  listIndustryDefinitions,
  hasIndustryModule,
  shouldUseGenericShell,
  type IndustryType,
} from './catalog';
import type { IndustryCategory } from './categories';

export type { IndustryType, ModuleIndustryId, IndustryDefinition } from './catalog';
export {
  INDUSTRY_IDS,
  INDUSTRY_DEFINITIONS,
  INDUSTRY_ALIASES,
  MODULE_INDUSTRY_IDS,
  PUBLIC_SELECTABLE_INDUSTRY_IDS,
  getIndustryDefinition,
  isIndustryType,
  isModuleIndustryId,
  listIndustryDefinitions,
  listIndustriesByCategory,
  hasIndustryModule,
  shouldUseGenericShell,
} from './catalog';
export type { IndustryCategory, IndustryCategoryOption } from './categories';
export {
  INDUSTRY_CATEGORY_OPTIONS,
  getIndustryCategoryLabel,
} from './categories';

export interface IndustryOption {
  value: IndustryType;
  label: string;
  description: string;
}

/** UI 선택용 — 카탈로그 정의와 동기화 */
export const INDUSTRY_OPTIONS: IndustryOption[] = listIndustryDefinitions({
  selectableOnly: true,
}).map((d) => ({
  value: d.id,
  label: d.label,
  description: d.description,
}));

/**
 * DB/입력 값을 IndustryType으로 정규화.
 * - 카탈로그 id → 그대로
 * - alias(taekwondo→gym 등) → 매핑
 * - unknown → piano (기존 기본값 유지)
 */
export function normalizeIndustryType(value?: string | null): IndustryType {
  if (!value) return 'piano';
  const aliased = INDUSTRY_ALIASES[value] ?? value;
  if (isIndustryType(aliased)) return aliased;
  return 'piano';
}

export function getIndustryLabel(value?: string | null): string {
  const def = getIndustryDefinition(value);
  if (def) return def.label;
  return INDUSTRY_DEFINITIONS[normalizeIndustryType(value)]?.label ?? '학원';
}

export function getIndustryCategoryForType(value?: string | null): IndustryCategory {
  return getIndustryDefinition(value)?.category ?? 'education';
}

/** 카탈로그 id ↔ definition 일치 검증 (테스트용) */
export function assertCatalogIntegrity(): void {
  for (const id of INDUSTRY_IDS) {
    const d = INDUSTRY_DEFINITIONS[id];
    if (!d || d.id !== id) {
      throw new Error(`catalog mismatch: ${id}`);
    }
  }
  for (const id of INDUSTRY_IDS) {
    if (hasIndustryModule(id) !== Boolean(INDUSTRY_DEFINITIONS[id].moduleId)) {
      throw new Error(`module flag mismatch: ${id}`);
    }
  }
  // unknown은 Generic 대상이 아님(정규화 → piano)
  if (shouldUseGenericShell('not_a_real_type')) {
    throw new Error('unknown industry must not use generic shell before normalize');
  }
}
