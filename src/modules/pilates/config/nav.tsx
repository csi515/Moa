import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  Activity,
  Settings,
  BarChart3,
  TrendingUp,
  Receipt,
  KeyRound,
} from 'lucide-react';
import { noticesNavItem } from '@/core/notices';

const icon = (node: ReactNode) => node;

/** 필라테스 사이드바 섹션 */
export function getPilatesSidebarSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    {
      title: '메인',
      items: [
        { tab: 'dashboard', label: '대시보드', icon: icon(<LayoutDashboard className="w-4 h-4" />) },
      ],
    },
    {
      title: labels.schedule.section,
      items: [
        {
          tab: 'bookings',
          label: labels.schedule.management,
          icon: icon(<Calendar className="w-4 h-4" />),
        },
        {
          tab: 'services',
          label: labels.service.management,
          icon: icon(<Dumbbell className="w-4 h-4" />),
        },
      ],
    },
    {
      title: labels.customer.section,
      items: [
        {
          tab: 'members',
          label: labels.customer.management,
          icon: icon(<Users className="w-4 h-4" />),
        },
        {
          tab: 'instructors',
          label: labels.staff.management,
          icon: icon(<Activity className="w-4 h-4" />),
        },
        { tab: 'attendance', label: '출입 관리', icon: icon(<KeyRound className="w-4 h-4" />) },
        noticesNavItem('sm'),
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
      items: [{ tab: 'settings', label: '스튜디오 설정', icon: icon(<Settings className="w-4 h-4" />) }],
    },
  ];
}

/** 필라테스 하단 메인 탭 */
export function getPilatesMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'bookings', label: '예약', icon: icon(<Calendar className="w-5 h-5" />) },
    { tab: 'members', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
  ];
}

/** 필라테스 하단 더보기 탭 */
export function getPilatesMoreTabs(): NavMenuItem[] {
  return [
    { tab: 'services', label: '수업 종류', icon: icon(<Dumbbell className="w-5 h-5" />) },
    { tab: 'instructors', label: '강사', icon: icon(<Activity className="w-5 h-5" />) },
    { tab: 'attendance', label: '출입 관리', icon: icon(<KeyRound className="w-5 h-5" />) },
    noticesNavItem('lg'),
    { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-5 h-5" />) },
    { tab: 'income', label: '수입 관리', icon: icon(<TrendingUp className="w-5 h-5" />) },
    { tab: 'expenses', label: '지출 관리', icon: icon(<Receipt className="w-5 h-5" />) },
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
  ];
}
