import type { NavTab } from '@/context/AppContext';
import type { ModuleTheme } from '@/shared/components/layout/moduleTheme';
import { normalizeIndustryType, type IndustryType } from './types';

export function resolveIndustry(industry: IndustryType | string | null | undefined): IndustryType {
  return normalizeIndustryType(industry);
}

export function isPilatesIndustry(industry: IndustryType | string | null | undefined): boolean {
  return resolveIndustry(industry) === 'pilates';
}

export function isTaekwondoIndustry(industry: IndustryType | string | null | undefined): boolean {
  return resolveIndustry(industry) === 'taekwondo';
}

/** 클래스(반) 기반 수업 — 피아노·태권도 */
export function usesClassBasedSchedule(industry: IndustryType | string | null | undefined): boolean {
  const type = resolveIndustry(industry);
  return type === 'piano' || type === 'taekwondo';
}

/** 원생/회원 목록 탭 */
export function getCustomerListTab(industry: IndustryType | string | null | undefined): NavTab {
  return isPilatesIndustry(industry) ? 'members' : 'students';
}

export function getModuleTheme(industry: IndustryType | string | null | undefined): ModuleTheme {
  const type = resolveIndustry(industry);
  if (type === 'pilates') return 'teal';
  if (type === 'taekwondo') return 'red';
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
  if (type === 'taekwondo') {
    return {
      btn: 'bg-red-600',
      btnHover: 'hover:bg-red-700',
      icon: 'text-red-600',
      hoverBg: 'hover:bg-red-50',
      ring: 'focus:ring-red-500 focus:border-red-300',
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
