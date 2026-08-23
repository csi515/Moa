import type { NavMenuSection, NavMenuItem } from '@/core/auth/navUtils';
import type { ModuleLabels } from './labels';
import {
  mainDashboardSection,
  financeNavSection,
  financeBottomNavItems,
} from '@/core/auth/navPresets';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Dumbbell,
  Activity,
  Settings,
  Package,
} from 'lucide-react';

export function buildPilatesNavSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    mainDashboardSection('sm'),
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
    financeNavSection('sm'),
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
      ...financeBottomNavItems('md'),
      { tab: 'settings', label: '설정', icon: <Settings className="w-5 h-5" /> },
    ],
  };
}
