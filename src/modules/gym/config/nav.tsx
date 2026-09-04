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
  buildNoticesNavSection,
  buildSettingsNavSection,
  buildStaffNavSection,
} from '@/core/auth/navBuilders';
import {
  AlertCircle,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Settings,
  UserPlus,
  UserSquare2,
  Users,
} from 'lucide-react';
import { noticesNavItem } from '@/core/notices';
import { accountNavItem } from '@/core/account';

const icon = (node: ReactNode) => node;

export function getGymSidebarSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    buildDashboardNavSection(),
    buildCustomerNavSection(labels),
    buildClassAttendanceNavSection(labels),
    buildNoticesNavSection(),
    buildBillingNavSection(),
    buildStaffNavSection(labels, '체육관 캘린더'),
    buildFinanceNavSection(),
    buildSettingsNavSection('체육관 설정'),
  ];
}

export function getGymMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'attendance', label: '출입', icon: icon(<CheckSquare className="w-5 h-5" />) },
  ];
}

export function getGymMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'parents', label: labels.contact.management, icon: icon(<UserSquare2 className="w-5 h-5" />) },
    { tab: 'enrollment-requests', label: '회원 등록 요청', icon: icon(<UserPlus className="w-5 h-5" />) },
    noticesNavItem('lg'),
    { tab: 'classes', label: '수업반', icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'timetable', label: '시간표', icon: icon(<Clock className="w-5 h-5" />) },
    { tab: 'tuition', label: '수강료/수납', icon: icon(<CreditCard className="w-5 h-5" />) },
    { tab: 'unpaid', label: '미납 통합', icon: icon(<AlertCircle className="w-5 h-5" />) },
    { tab: 'teachers', label: labels.staff.singular, icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'calendar', label: '캘린더', icon: icon(<Calendar className="w-5 h-5" />) },
    ...buildFinanceMoreTabs(),
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
    accountNavItem('lg'),
  ];
}
