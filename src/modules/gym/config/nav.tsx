import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Clock,
  CheckSquare,
  CreditCard,
  GraduationCap,
  Calendar,
  Settings,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Receipt,
  BookOpen,
} from 'lucide-react';
import { noticesNavItem } from '@/core/notices';

const icon = (node: ReactNode) => node;

export function getGymSidebarSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    {
      title: '메인',
      items: [
        { tab: 'dashboard', label: '대시보드', icon: icon(<LayoutDashboard className="w-4 h-4" />) },
      ],
    },
    {
      title: labels.customer.section,
      items: [
        { tab: 'students', label: labels.customer.management, icon: icon(<Users className="w-4 h-4" />) },
        {
          tab: 'parents',
          label: labels.contact.management,
          icon: icon(<UserSquare2 className="w-4 h-4" />),
        },
      ],
    },
    {
      title: labels.service.section ?? '수업 및 출결',
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
        { tab: 'attendance', label: '출입 관리', icon: icon(<CheckSquare className="w-4 h-4" />) },
      ],
    },
    {
      title: '안내',
      items: [noticesNavItem('sm')],
    },
    {
      title: '수납',
      items: [
        { tab: 'tuition', label: '수강료 및 수납', icon: icon(<CreditCard className="w-4 h-4" />) },
        { tab: 'unpaid', label: '미납 통합 관리', icon: icon(<AlertCircle className="w-4 h-4" />) },
      ],
    },
    {
      title: labels.staff.section ?? '지도진',
      items: [
        {
          tab: 'teachers',
          label: labels.staff.management,
          icon: icon(<GraduationCap className="w-4 h-4" />),
        },
        { tab: 'calendar', label: '체육관 캘린더', icon: icon(<Calendar className="w-4 h-4" />) },
      ],
    },
    {
      title: '재무 관리',
      items: [
        { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-4 h-4" />) },
        { tab: 'income', label: '수입 관리', icon: icon(<TrendingUp className="w-4 h-4" />) },
        { tab: 'expenses', label: '지출 관리', icon: icon(<Receipt className="w-4 h-4" />) },
      ],
    },
    {
      title: '설정',
      items: [
        { tab: 'guide', label: '사용 가이드', icon: icon(<BookOpen className="w-4 h-4" />) },
        { tab: 'settings', label: '체육관 설정', icon: icon(<Settings className="w-4 h-4" />) },
      ],
    },
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
    noticesNavItem('lg'),
    { tab: 'classes', label: '수업반', icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'timetable', label: '시간표', icon: icon(<Clock className="w-5 h-5" />) },
    { tab: 'tuition', label: '수강료/수납', icon: icon(<CreditCard className="w-5 h-5" />) },
    { tab: 'unpaid', label: '미납 통합', icon: icon(<AlertCircle className="w-5 h-5" />) },
    { tab: 'teachers', label: labels.staff.singular, icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'calendar', label: '캘린더', icon: icon(<Calendar className="w-5 h-5" />) },
    { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-5 h-5" />) },
    { tab: 'income', label: '수입', icon: icon(<TrendingUp className="w-5 h-5" />) },
    { tab: 'expenses', label: '지출', icon: icon(<Receipt className="w-5 h-5" />) },
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
  ];
}
