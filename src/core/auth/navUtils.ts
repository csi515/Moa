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
 * 허브 하위 탭(딥링크)을 사이드바·하단 네비 하이라이트용 대표 탭으로 정규화
 */
export function resolveNavHighlightTab(tab: NavTab): NavTab {
  switch (tab) {
    case 'income':
    case 'expenses':
    case 'tuition':
    case 'unpaid':
      return 'finance';
    case 'parents':
    case 'enrollment-requests':
      return 'students';
    case 'passes':
      return 'members';
    case 'calendar':
    case 'makeups':
      return 'timetable';
    case 'attendance':
      return 'lessons';
    case 'check-in':
      return 'settings';
    case 'services':
      return 'bookings';
    case 'medications':
      return 'journals';
    case 'teachers':
    case 'instructors':
    case 'notices':
    case 'account':
      return 'settings';
    default:
      return tab;
  }
}

/** 네비 항목이 현재 활성 허브에 속하는지 */
export function isNavItemActive(itemTab: NavTab, activeTab: NavTab): boolean {
  return resolveNavHighlightTab(activeTab) === itemTab || activeTab === itemTab;
}
