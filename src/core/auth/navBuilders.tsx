import type { ReactNode } from 'react';
import type { ModuleLabels } from '@/modules/piano/config/labels';
import type { NavMenuItem, NavMenuSection } from './navUtils';
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Settings,
  UserSquare2,
  Users,
} from 'lucide-react';
import { accountNavItem } from '@/core/account';
import { noticesNavItem } from '@/core/notices';

const icon = (node: ReactNode) => node;

export function buildDashboardNavSection(): NavMenuSection {
  return {
    title: '메인',
    items: [
      { tab: 'dashboard', label: '대시보드', icon: icon(<LayoutDashboard className="w-4 h-4" />) },
    ],
  };
}

export function buildCustomerNavSection(labels: ModuleLabels): NavMenuSection {
  return {
    title: labels.customer.section,
    items: [
      { tab: 'students', label: labels.customer.management, icon: icon(<Users className="w-4 h-4" />) },
      {
        tab: 'parents',
        label: labels.contact.management,
        icon: icon(<UserSquare2 className="w-4 h-4" />),
      },
    ],
  };
}

export function buildClassAttendanceNavSection(
  labels: ModuleLabels,
  options?: {
    extraItems?: NavMenuItem[];
    sectionTitle?: string;
    attendanceLabel?: string;
  }
): NavMenuSection {
  return {
    title: options?.sectionTitle ?? labels.service.section ?? '수업 및 출결',
    items: [
      {
        tab: 'classes',
        label: labels.service.management,
        icon: icon(<GraduationCap className="w-4 h-4" />),
      },
      {
        tab: 'timetable',
        label: labels.schedule.management,
        icon: icon(<Clock className="w-4 h-4" />),
      },
      {
        tab: 'attendance',
        label: options?.attendanceLabel ?? '출입 관리',
        icon: icon(<CheckSquare className="w-4 h-4" />),
      },
      ...(options?.extraItems ?? []),
    ],
  };
}

export function buildNavSection(title: string, items: NavMenuItem[]): NavMenuSection {
  return { title, items };
}

export function buildNoticesNavSection(): NavMenuSection {
  return {
    title: '안내',
    items: [noticesNavItem('sm')],
  };
}

export function buildBillingNavSection(options?: {
  tuitionLabel?: string;
  extraItems?: NavMenuItem[];
}): NavMenuSection {
  /** @deprecated 재무 허브로 병합 — 호환용으로 수납 항목만 반환 */
  return {
    title: '수납',
    items: [
      {
        tab: 'finance',
        label: options?.tuitionLabel ?? '재무',
        icon: icon(<CreditCard className="w-4 h-4" />),
      },
      ...(options?.extraItems ?? []),
    ],
  };
}

export function buildFinanceNavSection(): NavMenuSection {
  return {
    title: '재무',
    items: [
      { tab: 'finance', label: '재무', icon: icon(<BarChart3 className="w-4 h-4" />) },
    ],
  };
}

export function buildFinanceNavItem(size: 'sm' | 'md' = 'sm'): NavMenuItem {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return { tab: 'finance', label: '재무', icon: icon(<BarChart3 className={cls} />) };
}

export function buildStaffNavSection(
  labels: ModuleLabels,
  calendarLabel: string
): NavMenuSection {
  return {
    title: labels.staff.section ?? '지도진',
    items: [
      {
        tab: 'teachers',
        label: labels.staff.management,
        icon: icon(<GraduationCap className="w-4 h-4" />),
      },
      { tab: 'calendar', label: calendarLabel, icon: icon(<Calendar className="w-4 h-4" />) },
    ],
  };
}

export function buildSettingsNavSection(settingsLabel: string): NavMenuSection {
  return {
    title: '설정',
    items: [
      { tab: 'settings', label: settingsLabel, icon: icon(<Settings className="w-4 h-4" />) },
      accountNavItem('sm'),
    ],
  };
}

/** 설정 허브용 — 사업장·직원·안내·계정 */
export function buildSettingsHubNavSection(
  settingsLabel: string,
  staffLabel: string
): NavMenuSection {
  return {
    title: '설정',
    items: [
      { tab: 'settings', label: settingsLabel, icon: icon(<Settings className="w-4 h-4" />) },
      {
        tab: 'teachers',
        label: staffLabel,
        icon: icon(<GraduationCap className="w-4 h-4" />),
      },
      noticesNavItem('sm'),
      accountNavItem('sm'),
    ],
  };
}

export function buildFinanceMoreTabs(): NavMenuItem[] {
  return [buildFinanceNavItem('md')];
}
