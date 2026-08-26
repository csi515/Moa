import type { NavTab } from '@/context/AppContext';
import type { ModuleTheme } from '@/shared/components/layout/moduleTheme';
import { normalizeIndustryType, type IndustryType } from './types';
import { getIndustryPlugin } from './registry';
import type { IndustryAccent } from './pluginTypes';

export type { IndustryAccent } from './pluginTypes';

export function resolveIndustry(industry: IndustryType | string | null | undefined): IndustryType {
  return normalizeIndustryType(industry);
}

export function isPilatesIndustry(industry: IndustryType | string | null | undefined): boolean {
  return resolveIndustry(industry) === 'pilates';
}

export function isGymIndustry(industry: IndustryType | string | null | undefined): boolean {
  return resolveIndustry(industry) === 'gym';
}

export function isDaycareIndustry(industry: IndustryType | string | null | undefined): boolean {
  return resolveIndustry(industry) === 'daycare';
}

/** 클래스(반) 기반 수업 — 플러그인 매니페스트 기준 */
export function usesClassBasedSchedule(industry: IndustryType | string | null | undefined): boolean {
  return getIndustryPlugin(industry).usesClassBasedSchedule;
}

/** 원생/회원 목록 탭 */
export function getCustomerListTab(industry: IndustryType | string | null | undefined): NavTab {
  return getIndustryPlugin(industry).customerListTab;
}

export function getModuleTheme(industry: IndustryType | string | null | undefined): ModuleTheme {
  return getIndustryPlugin(industry).theme;
}

export function getIndustryAccent(industry: IndustryType | string | null | undefined): IndustryAccent {
  return getIndustryPlugin(industry).accent;
}
