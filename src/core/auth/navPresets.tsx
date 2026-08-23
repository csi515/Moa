import type { NavMenuItem, NavMenuSection } from './navUtils';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  Clock,
  CheckSquare,
  CreditCard,
  Receipt,
  GraduationCap,
  AlertCircle,
  Sparkles,
  BarChart3,
  TrendingUp,
  Calendar,
  Settings,
  Package,
} from 'lucide-react';

type IconSize = 'sm' | 'md';

const iconClass = (size: IconSize) => (size === 'sm' ? 'w-4 h-4' : 'w-5 h-5');

/** 공통 대시보드 탭 */
export function dashboardNavItem(size: IconSize, label = '대시보드'): NavMenuItem {
  return {
    tab: 'dashboard',
    label,
    icon: <LayoutDashboard className={iconClass(size)} />,
  };
}

/** 메인 섹션 (대시보드) */
export function mainDashboardSection(size: IconSize, label = '대시보드'): NavMenuSection {
  return {
    title: '메인',
    items: [dashboardNavItem(size, label)],
  };
}

/** 4개 업종 공통 재무 관리 섹션 */
export function financeNavSection(size: IconSize): NavMenuSection {
  const cls = iconClass(size);
  return {
    title: '재무 관리',
    items: [
      { tab: 'finance', label: '재무 요약', icon: <BarChart3 className={cls} /> },
      { tab: 'income', label: '수입 관리', icon: <TrendingUp className={cls} /> },
      { tab: 'expenses', label: '지출 관리', icon: <Receipt className={cls} /> },
    ],
  };
}

/** 재무 관련 더보기 탭 (모바일) */
export function financeBottomNavItems(size: IconSize): NavMenuItem[] {
  const cls = iconClass(size);
  return [
    { tab: 'finance', label: '재무 요약', icon: <BarChart3 className={cls} /> },
    { tab: 'income', label: '수입 관리', icon: <TrendingUp className={cls} /> },
    { tab: 'expenses', label: '지출 관리', icon: <Receipt className={cls} /> },
  ];
}

/** 학원형(피아노·종합학원) 고객 섹션 */
export function academyCustomerSection(
  labels: {
    customer: { section: string; management: string };
    contact: { management: string };
  },
  size: IconSize
): NavMenuSection {
  const cls = iconClass(size);
  return {
    title: labels.customer.section,
    items: [
      { tab: 'students', label: labels.customer.management, icon: <Users className={cls} /> },
      { tab: 'parents', label: labels.contact.management, icon: <UserSquare2 className={cls} /> },
    ],
  };
}

/** 학원형 수업·출결 섹션 */
export function academyClassAttendanceSection(
  labels: { service: { management: string }; schedule: { management: string } },
  size: IconSize
): NavMenuSection {
  const cls = iconClass(size);
  return {
    title: '수업 및 출결',
    items: [
      { tab: 'classes', label: labels.service.management, icon: <GraduationCap className={cls} /> },
      { tab: 'timetable', label: labels.schedule.management, icon: <Clock className={cls} /> },
      { tab: 'attendance', label: '출결 관리', icon: <CheckSquare className={cls} /> },
      { tab: 'makeups', label: '보강 수업', icon: <Sparkles className={cls} /> },
    ],
  };
}

/** 학원형 수납·회계 섹션 */
export function academyTuitionSection(size: IconSize, productsLabel: string): NavMenuSection {
  const cls = iconClass(size);
  return {
    title: '수납 및 회계',
    items: [
      { tab: 'tuition', label: '수강료 및 수납', icon: <CreditCard className={cls} /> },
      { tab: 'unpaid', label: '미납 통합 관리', icon: <AlertCircle className={cls} /> },
      { tab: 'products', label: productsLabel, icon: <Package className={cls} /> },
    ],
  };
}

/** 학원형 운영 섹션 (추가 탭 병합 가능) */
export function academyOperationsSection(
  labels: { staff: { management: string } },
  size: IconSize,
  extraItems: NavMenuItem[] = []
): NavMenuSection {
  const cls = iconClass(size);
  return {
    title: '학원 운영',
    items: [
      { tab: 'teachers', label: labels.staff.management, icon: <GraduationCap className={cls} /> },
      { tab: 'calendar', label: '학원 캘린더', icon: <Calendar className={cls} /> },
      ...extraItems,
      { tab: 'settings', label: '학원 설정', icon: <Settings className={cls} /> },
    ],
  };
}

/** 학원형 모바일 하단 주요 탭 */
export function academyStyleBottomMainTabs(labels: {
  customer: { singular: string };
  schedule: { singular: string };
}): NavMenuItem[] {
  return [
    dashboardNavItem('md'),
    { tab: 'students', label: labels.customer.singular, icon: <Users className="w-5 h-5" /> },
    { tab: 'timetable', label: labels.schedule.singular, icon: <Clock className="w-5 h-5" /> },
    { tab: 'attendance', label: '출결', icon: <CheckSquare className="w-5 h-5" /> },
  ];
}

/** 학원형 공통 더보기 탭 (수납·재무·운영) */
export function academyStyleBottomSharedMoreTabs(
  labels: {
    contact: { management: string };
    service: { management: string };
    staff: { management: string };
  },
  options: { productsLabel: string; includeClasses?: boolean }
): NavMenuItem[] {
  const items: NavMenuItem[] = [
    { tab: 'tuition', label: '수강료/수납', icon: <CreditCard className="w-5 h-5" /> },
    { tab: 'unpaid', label: '미납 통합', icon: <AlertCircle className="w-5 h-5" /> },
    { tab: 'makeups', label: '보강 수업', icon: <Sparkles className="w-5 h-5" /> },
    { tab: 'products', label: options.productsLabel, icon: <Package className="w-5 h-5" /> },
    ...financeBottomNavItems('md'),
    { tab: 'parents', label: labels.contact.management, icon: <UserSquare2 className="w-5 h-5" /> },
  ];

  if (options.includeClasses) {
    items.splice(3, 0, {
      tab: 'classes',
      label: labels.service.management,
      icon: <GraduationCap className="w-5 h-5" />,
    });
  }

  items.push(
    { tab: 'teachers', label: labels.staff.management, icon: <GraduationCap className="w-5 h-5" /> },
    { tab: 'calendar', label: '학원 캘린더', icon: <Calendar className="w-5 h-5" /> },
    { tab: 'settings', label: '학원 설정', icon: <Settings className="w-5 h-5" /> }
  );

  return items;
}
