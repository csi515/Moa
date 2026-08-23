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
  Sparkles,
  Ticket,
  MessageSquareText,
  Activity,
  Settings,
  Package,
} from 'lucide-react';

export function buildSkincareNavSections(labels: ModuleLabels): NavMenuSection[] {
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
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          tab: 'care-programs',
          label: labels.careProgram.management,
          icon: <Ticket className="w-4 h-4" />,
        },
        { tab: 'products', label: '홈케어 제품', icon: <Package className="w-4 h-4" /> },
      ],
    },
    {
      title: labels.customer.section,
      items: [
        { tab: 'members', label: labels.customer.management, icon: <Users className="w-4 h-4" /> },
        {
          tab: 'consultations',
          label: '상담·피부 기록',
          icon: <MessageSquareText className="w-4 h-4" />,
        },
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
      items: [{ tab: 'settings', label: '샵 설정', icon: <Settings className="w-4 h-4" /> }],
    },
  ];
}

export function buildSkincareBottomNavTabs(labels: ModuleLabels): {
  mainTabs: NavMenuItem[];
  moreTabs: NavMenuItem[];
} {
  return {
    mainTabs: [
      { tab: 'dashboard', label: '홈', icon: <LayoutDashboard className="w-5 h-5" /> },
      { tab: 'bookings', label: '예약', icon: <Calendar className="w-5 h-5" /> },
      { tab: 'members', label: labels.customer.singular, icon: <Users className="w-5 h-5" /> },
      {
        tab: 'care-programs',
        label: '프로그램',
        icon: <Ticket className="w-5 h-5" />,
      },
    ],
    moreTabs: [
      { tab: 'services', label: '시술 메뉴', icon: <Sparkles className="w-5 h-5" /> },
      { tab: 'products', label: '제품', icon: <Package className="w-5 h-5" /> },
      {
        tab: 'consultations',
        label: '상담 기록',
        icon: <MessageSquareText className="w-5 h-5" />,
      },
      { tab: 'instructors', label: '관리사', icon: <Activity className="w-5 h-5" /> },
      ...financeBottomNavItems('md'),
      { tab: 'settings', label: '설정', icon: <Settings className="w-5 h-5" /> },
    ],
  };
}
