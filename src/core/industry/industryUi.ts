import type { NavTab } from '@/context/AppContext';
import type { ModuleTheme } from '@/shared/components/layout/moduleTheme';
import { normalizeIndustryType, type IndustryType } from './types';

export function resolveIndustry(industry: IndustryType | string | null | undefined): IndustryType {
  return normalizeIndustryType(industry);
}

export function isPilatesIndustry(industry: IndustryType | string | null | undefined): boolean {
  return resolveIndustry(industry) === 'pilates';
}

export function isGymIndustry(industry: IndustryType | string | null | undefined): boolean {
  return resolveIndustry(industry) === 'gym';
}

/** 클래스(반) 기반 수업 — 피아노·체육관 */
export function usesClassBasedSchedule(industry: IndustryType | string | null | undefined): boolean {
  const type = resolveIndustry(industry);
  return type === 'piano' || type === 'gym';
}

/** 원생/회원 목록 탭 */
export function getCustomerListTab(industry: IndustryType | string | null | undefined): NavTab {
  return isPilatesIndustry(industry) ? 'members' : 'students';
}

export function getModuleTheme(industry: IndustryType | string | null | undefined): ModuleTheme {
  const type = resolveIndustry(industry);
  if (type === 'pilates') return 'teal';
  if (type === 'gym') return 'orange';
  return 'indigo';
}

export interface IndustryAccent {
  btn: string;
  btnHover: string;
  icon: string;
  hoverBg: string;
  ring: string;
}

export function getIndustryAccent(industry: IndustryType | string | null | undefined): IndustryAccent {
  const type = resolveIndustry(industry);
  if (type === 'pilates') {
    return {
      btn: 'bg-teal-600',
      btnHover: 'hover:bg-teal-700',
      icon: 'text-teal-600',
      hoverBg: 'hover:bg-teal-50',
      ring: 'focus:ring-teal-500 focus:border-teal-300',
    };
  }
  if (type === 'gym') {
    return {
      btn: 'bg-orange-600',
      btnHover: 'hover:bg-orange-700',
      icon: 'text-orange-600',
      hoverBg: 'hover:bg-orange-50',
      ring: 'focus:ring-orange-500 focus:border-orange-300',
    };
  }
  return {
    btn: 'bg-indigo-600',
    btnHover: 'hover:bg-indigo-700',
    icon: 'text-indigo-600',
    hoverBg: 'hover:bg-indigo-50',
    ring: 'focus:ring-indigo-500 focus:border-indigo-300',
  };
}
