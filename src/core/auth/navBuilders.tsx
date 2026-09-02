import type { ReactNode } from 'react';
import type { ModuleLabels } from '@/modules/piano/config/labels';
import type { NavMenuItem, NavMenuSection } from './navUtils';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Receipt,
  Settings,
  TrendingUp,
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
  return {
    title: '수납',
    items: [
      {
        tab: 'tuition',
        label: options?.tuitionLabel ?? '수강료 및 수납',
        icon: icon(<CreditCard className="w-4 h-4" />),
      },
      { tab: 'unpaid', label: '미납 통합 관리', icon: icon(<AlertCircle className="w-4 h-4" />) },
      ...(options?.extraItems ?? []),
    ],
  };
}

export function buildFinanceNavSection(): NavMenuSection {
  return {
    title: '재무 관리',
    items: [
      { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-4 h-4" />) },
      { tab: 'income', label: '수입 관리', icon: icon(<TrendingUp className="w-4 h-4" />) },
      { tab: 'expenses', label: '지출 관리', icon: icon(<Receipt className="w-4 h-4" />) },
    ],
  };
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

export function buildFinanceMoreTabs(): NavMenuItem[] {
  return [
    { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-5 h-5" />) },
    { tab: 'income', label: '수입', icon: icon(<TrendingUp className="w-5 h-5" />) },
    { tab: 'expenses', label: '지출', icon: icon(<Receipt className="w-5 h-5" />) },
  ];
}
