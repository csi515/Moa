import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import {
  buildBillingNavSection,
  buildClassAttendanceNavSection,
  buildCustomerNavSection,
  buildDashboardNavSection,
  buildFinanceMoreTabs,
  buildFinanceNavSection,
  buildNavSection,
  buildSettingsNavSection,
  buildStaffNavSection,
} from '@/core/auth/navBuilders';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Pill,
  Settings,
  UserSquare2,
  Users,
} from 'lucide-react';
import { NOTICE_COPY, noticesNavItem } from '@/core/notices';
import { accountNavItem } from '@/core/account';

const icon = (node: ReactNode) => node;

export function getDaycareSidebarSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    buildDashboardNavSection(),
    buildCustomerNavSection(labels),
    buildClassAttendanceNavSection(labels, {
      sectionTitle: labels.service.section ?? '반·출결',
      attendanceLabel: '등·하원 관리',
    }),
    buildNavSection('보육 기록', [
      { tab: 'journals', label: '알림장', icon: icon(<BookOpen className="w-4 h-4" />) },
      { tab: 'medications', label: '투약 관리', icon: icon(<Pill className="w-4 h-4" />) },
      noticesNavItem('sm', NOTICE_COPY.daycareNavLabel),
      {
        tab: 'consultations',
        label: '상담 이력',
        icon: icon(<MessageSquareText className="w-4 h-4" />),
      },
    ]),
    buildBillingNavSection({ tuitionLabel: '보육료 및 수납' }),
    buildStaffNavSection(labels, '원 캘린더'),
    buildFinanceNavSection(),
    buildSettingsNavSection('어린이집 설정'),
  ];
}

export function getDaycareMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'journals', label: '알림장', icon: icon(<BookOpen className="w-5 h-5" />) },
  ];
}

export function getDaycareMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'attendance', label: '등하원', icon: icon(<CheckSquare className="w-5 h-5" />) },
    { tab: 'medications', label: '투약', icon: icon(<Pill className="w-5 h-5" />) },
    noticesNavItem('lg', NOTICE_COPY.daycareNavLabel),
    { tab: 'parents', label: labels.contact.management, icon: icon(<UserSquare2 className="w-5 h-5" />) },
    { tab: 'classes', label: '반 관리', icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'timetable', label: '시간표', icon: icon(<Clock className="w-5 h-5" />) },
    {
      tab: 'consultations',
      label: '상담 이력',
      icon: icon(<MessageSquareText className="w-5 h-5" />),
    },
    { tab: 'tuition', label: '보육료/수납', icon: icon(<CreditCard className="w-5 h-5" />) },
    { tab: 'unpaid', label: '미납 통합', icon: icon(<AlertCircle className="w-5 h-5" />) },
    { tab: 'teachers', label: labels.staff.singular, icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'calendar', label: '캘린더', icon: icon(<Calendar className="w-5 h-5" />) },
    ...buildFinanceMoreTabs(),
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
    accountNavItem('lg'),
  ];
}
