import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import { buildFinanceNavItem, buildNavSection } from '@/core/auth/navBuilders';
import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Users,
} from 'lucide-react';

const icon = (node: ReactNode) => node;

/** Core + 출결·보육·상담 오버레이 */
export function getDaycareSidebarSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    buildNavSection('업무', [
      { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-4 h-4" />) },
      {
        tab: 'students',
        label: labels.customer.singular,
        icon: icon(<Users className="w-4 h-4" />),
      },
      {
        tab: 'timetable',
        label: '일정',
        icon: icon(<CalendarDays className="w-4 h-4" />),
      },
      { tab: 'attendance', label: '출결', icon: icon(<CheckSquare className="w-4 h-4" />) },
      {
        tab: 'journals',
        label: '보육',
        icon: icon(<BookOpen className="w-4 h-4" />),
      },
      {
        tab: 'consultations',
        label: '상담',
        icon: icon(<MessageSquareText className="w-4 h-4" />),
      },
      buildFinanceNavItem('sm'),
    ]),
    buildNavSection('설정', [
      { tab: 'settings', label: '설정', icon: icon(<Settings className="w-4 h-4" />) },
    ]),
  ];
}

export function getDaycareMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'timetable', label: '일정', icon: icon(<CalendarDays className="w-5 h-5" />) },
    buildFinanceNavItem('md'),
  ];
}

export function getDaycareMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    {
      tab: 'consultations',
      label: '상담',
      icon: icon(<MessageSquareText className="w-5 h-5" />),
    },
    { tab: 'attendance', label: '출결', icon: icon(<CheckSquare className="w-5 h-5" />) },
    { tab: 'journals', label: '보육', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
    {
      tab: 'classes',
      label: labels.service.singular,
      icon: icon(<GraduationCap className="w-5 h-5" />),
    },
  ];
}
