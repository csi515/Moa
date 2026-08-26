import type { IndustryPluginManifest } from '@/core/industry/pluginTypes';
import { CLASS_BASED_CORE_ADMIN_TABS, CLASS_BASED_CORE_STAFF_TABS } from '@/core/industry/pluginTypes';

/** 어린이집 플러그인 매니페스트 — 코어 원생/출결/수납 + 상담 */
export const daycarePluginManifest: IndustryPluginManifest = {
  id: 'daycare',
  option: {
    value: 'daycare',
    label: '어린이집',
    description: '원아·보호자·반·출결·보육료 중심 운영',
  },
  theme: 'sky',
  accent: {
    btn: 'bg-sky-600',
    btnHover: 'hover:bg-sky-700',
    icon: 'text-sky-600',
    hoverBg: 'hover:bg-sky-50',
    ring: 'focus:ring-sky-500 focus:border-sky-300',
  },
  attendanceDefault: true,
  usesClassBasedSchedule: true,
  customerListTab: 'students',
  showSchoolFields: false,
  levelLabel: '연령반',
  adminTabs: [...CLASS_BASED_CORE_ADMIN_TABS, 'consultations'],
  staffTabs: [...CLASS_BASED_CORE_STAFF_TABS, 'consultations'],
};
