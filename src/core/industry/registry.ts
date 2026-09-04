import type { IndustryType, IndustryOption } from './types';
import {
  getIndustryDefinition,
  INDUSTRY_OPTIONS,
  hasIndustryModule,
  normalizeIndustryType,
} from './types';
import type { IndustryPluginManifest } from './pluginTypes';
import { pianoPluginManifest } from '@/modules/piano/plugin';
import { pilatesPluginManifest } from '@/modules/pilates/plugin';
import { gymPluginManifest } from '@/modules/gym/plugin';
import { daycarePluginManifest } from '@/modules/daycare/plugin';
import { buildGenericPluginManifest } from './genericPlugin';
import type { ModuleIndustryId } from './catalog';
import { isModuleIndustryId } from './catalog';

/** 전용 모듈이 있는 업종 플러그인만 static 등록 */
export const INDUSTRY_PLUGINS: IndustryPluginManifest[] = [
  pianoPluginManifest,
  pilatesPluginManifest,
  gymPluginManifest,
  daycarePluginManifest,
];

const MODULE_BY_ID = Object.fromEntries(INDUSTRY_PLUGINS.map((p) => [p.id, p])) as Record<
  ModuleIndustryId,
  IndustryPluginManifest
>;

/**
 * 업종 플러그인 조회.
 * 모듈이 있으면 해당 매니페스트, 없으면 Generic 매니페스트(카탈로그 기반).
 */
export function getIndustryPlugin(
  industry: IndustryType | string | null | undefined
): IndustryPluginManifest {
  const type = normalizeIndustryType(industry);
  const definition = getIndustryDefinition(type);
  const moduleId = definition?.moduleId;

  if (moduleId && isModuleIndustryId(moduleId) && moduleId in MODULE_BY_ID) {
    return MODULE_BY_ID[moduleId];
  }
  if (definition) {
    return buildGenericPluginManifest(definition);
  }
  return MODULE_BY_ID.piano;
}

/** 가입·생성 UI용 — INDUSTRY_OPTIONS와 동일 출처 */
export function listIndustryOptions(): IndustryOption[] {
  return INDUSTRY_OPTIONS;
}

/** 모듈이 등록된 업종 id만 */
export function listIndustryIds(): IndustryType[] {
  return INDUSTRY_PLUGINS.map((p) => p.id);
}

/** 카탈로그 moduleId 기준 (alias 포함) */
export function hasModulePlugin(industry: IndustryType | string | null | undefined): boolean {
  return hasIndustryModule(industry);
}
