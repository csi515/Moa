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
