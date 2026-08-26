import type { IndustryPluginManifest } from '@/core/industry/pluginTypes';
import { CLASS_BASED_CORE_ADMIN_TABS, CLASS_BASED_CORE_STAFF_TABS } from '@/core/industry/pluginTypes';

/** 체육관 플러그인 매니페스트 */
export const gymPluginManifest: IndustryPluginManifest = {
  id: 'gym',
  option: {
    value: 'gym',
    label: '체육관',
    description: '회원·수업반·출결·수강료 중심 운영',
  },
  aliases: ['taekwondo'],
  theme: 'orange',
  accent: {
    btn: 'bg-orange-600',
    btnHover: 'hover:bg-orange-700',
    icon: 'text-orange-600',
    hoverBg: 'hover:bg-orange-50',
    ring: 'focus:ring-orange-500 focus:border-orange-300',
  },
  attendanceDefault: true,
  usesClassBasedSchedule: true,
  customerListTab: 'students',
  showSchoolFields: false,
  levelLabel: '수업 레벨',
  adminTabs: [...CLASS_BASED_CORE_ADMIN_TABS, 'notices'],
  staffTabs: [...CLASS_BASED_CORE_STAFF_TABS, 'notices'],
};
