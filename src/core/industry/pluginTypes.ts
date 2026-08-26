import type { NavTab } from '@/context/AppContext';
import type { ModuleTheme } from '@/shared/components/layout/moduleTheme';
import type { IndustryOption, IndustryType } from './types';

export interface IndustryAccent {
  btn: string;
  btnHover: string;
  icon: string;
  hoverBg: string;
  ring: string;
}

/**
 * 업종 플러그인 메타데이터.
 * AppContent/Labels는 IndustryAppRouter에서 등록하고,
 * 탭·테마·출결 기본값 등은 이 매니페스트로 통일한다.
 */
export interface IndustryPluginManifest {
  id: IndustryType;
  option: IndustryOption;
  /** 구 industry_type 값 호환 */
  aliases?: string[];
  theme: ModuleTheme;
  accent: IndustryAccent;
  attendanceDefault: boolean;
  usesClassBasedSchedule: boolean;
  customerListTab: NavTab;
  showSchoolFields: boolean;
  levelLabel: string;
  adminTabs: NavTab[];
  staffTabs: NavTab[];
}

const OWNER_FINANCE_TABS: NavTab[] = ['finance', 'income', 'expenses'];

/** 반·시간표·출결·수납 중심 코어 메뉴 (체육관·어린이집 등) */
export const CLASS_BASED_CORE_ADMIN_TABS: NavTab[] = [
  'dashboard',
  'students',
  'parents',
  'classes',
  'timetable',
  'attendance',
  'tuition',
  'unpaid',
  'teachers',
  'calendar',
  'settings',
];

export const CLASS_BASED_CORE_STAFF_TABS: NavTab[] = [
  'dashboard',
  'students',
  'classes',
  'timetable',
  'attendance',
];

export function withOwnerFinanceTabs(tabs: NavTab[]): NavTab[] {
  const merged = [...tabs];
  for (const tab of OWNER_FINANCE_TABS) {
    if (!merged.includes(tab)) merged.push(tab);
  }
  return merged;
}
