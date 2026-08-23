import type { NavMenuSection, NavMenuItem } from '@/core/auth/navUtils';
import type { ModuleLabels } from './labels';
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
  Package,
} from 'lucide-react';

export function buildPilatesNavSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    {
      title: '메인',
      items: [
        { tab: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: labels.schedule.section,
      items: [
        {
          tab: 'bookings',
          label: labels.schedule.management,
          icon: <Calendar className="w-4 h-4" />,
        },
        {
          tab: 'services',
          label: labels.service.management,
          icon: <Dumbbell className="w-4 h-4" />,
        },
        { tab: 'products', label: '상품 관리', icon: <Package className="w-4 h-4" /> },
      ],
    },
    {
      title: labels.customer.section,
      items: [
        { tab: 'members', label: labels.customer.management, icon: <Users className="w-4 h-4" /> },
        {
          tab: 'instructors',
          label: labels.staff.management,
          icon: <Activity className="w-4 h-4" />,
        },
      ],
    },
    {
      title: '재무 관리',
      items: [
        { tab: 'finance', label: '재무 요약', icon: <BarChart3 className="w-4 h-4" /> },
        { tab: 'income', label: '수입 관리', icon: <TrendingUp className="w-4 h-4" /> },
        { tab: 'expenses', label: '지출 관리', icon: <Receipt className="w-4 h-4" /> },
      ],
    },
    {
      title: '설정',
      items: [{ tab: 'settings', label: '스튜디오 설정', icon: <Settings className="w-4 h-4" /> }],
    },
  ];
}

export function buildPilatesBottomNavTabs(labels: ModuleLabels): {
  mainTabs: NavMenuItem[];
  moreTabs: NavMenuItem[];
} {
  return {
    mainTabs: [
      { tab: 'dashboard', label: '홈', icon: <LayoutDashboard className="w-5 h-5" /> },
      { tab: 'bookings', label: '예약', icon: <Calendar className="w-5 h-5" /> },
      { tab: 'members', label: labels.customer.singular, icon: <Users className="w-5 h-5" /> },
    ],
    moreTabs: [
      { tab: 'services', label: '수업 종류', icon: <Dumbbell className="w-5 h-5" /> },
      { tab: 'products', label: '상품 관리', icon: <Package className="w-5 h-5" /> },
      { tab: 'instructors', label: '강사', icon: <Activity className="w-5 h-5" /> },
      { tab: 'finance', label: '재무 요약', icon: <BarChart3 className="w-5 h-5" /> },
      { tab: 'income', label: '수입 관리', icon: <TrendingUp className="w-5 h-5" /> },
      { tab: 'expenses', label: '지출 관리', icon: <Receipt className="w-5 h-5" /> },
      { tab: 'settings', label: '설정', icon: <Settings className="w-5 h-5" /> },
    ],
  };
}
