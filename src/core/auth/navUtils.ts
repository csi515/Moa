import type { ReactNode } from 'react';
import type { NavTab } from '@/context/AppContext';

export interface NavMenuItem {
  tab: NavTab;
  label: string;
  icon: ReactNode;
}

export interface NavMenuSection {
  title: string;
  items: NavMenuItem[];
}

/** 허용된 탭만 남기고 빈 섹션 제거 */
export function filterNavSections(
  sections: NavMenuSection[],
  allowedTabs: NavTab[]
): NavMenuSection[] {
  const allowed = new Set(allowedTabs);
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowed.has(item.tab)),
    }))
    .filter((section) => section.items.length > 0);
}

/** 탭 목록 필터 */
export function filterNavTabs<T extends { tab: NavTab }>(items: T[], allowedTabs: NavTab[]): T[] {
  const allowed = new Set(allowedTabs);
  return items.filter((item) => allowed.has(item.tab));
}

/**
 * 허브 하위·레거시 딥링크 → 사이드바·하단 네비 하이라이트용 대표 탭
 * (화면은 VIEW_MAP 별칭으로 동일 허브에 연결)
 *
 * 피아노는 modules/piano/config/navHighlight.ts 가 이 함수를 확장한다.
 * - lessons → attendance (레거시「레슨」딥링크)
 * - calendar/makeups/practice-rooms → timetable
 * - tuition/unpaid/… → finance
 */
export function resolveNavHighlightTab(tab: NavTab): NavTab {
  switch (tab) {
    case 'income':
    case 'expenses':
    case 'tuition':
    case 'unpaid':
    case 'payroll':
      return 'finance';
    case 'parents':
    case 'enrollment-requests':
      return 'students';
    case 'passes':
      return 'members';
    case 'calendar':
    case 'makeups':
    case 'practice-rooms':
      return 'timetable';
    /** 구「레슨」딥링크 — 출결 화면으로 통합됨 (탭명 lessons 유지) */
    case 'lessons':
      return 'attendance';
    case 'check-in':
    case 'teachers':
    case 'instructors':
    case 'notices':
    case 'account':
      return 'settings';
    case 'services':
      return 'bookings';
    case 'medications':
      return 'journals';
    default:
      return tab;
  }
}

/** 네비 항목이 현재 활성 허브에 속하는지 */
export function isNavItemActive(itemTab: NavTab, activeTab: NavTab): boolean {
  return resolveNavHighlightTab(activeTab) === itemTab || activeTab === itemTab;
}
