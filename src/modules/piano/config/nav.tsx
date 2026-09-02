import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import {
  buildClassAttendanceNavSection,
  buildCustomerNavSection,
  buildDashboardNavSection,
  buildFinanceMoreTabs,
  buildFinanceNavSection,
  buildNavSection,
} from '@/core/auth/navBuilders';
import {
  AlertCircle,
  Award,
  BookOpen,
  BookOpenCheck,
  Calendar,
  CheckSquare,
  Clock,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Music2,
  Piano,
  Settings,
  Sparkles,
  UserSquare2,
  Users,
} from 'lucide-react';
import { noticesNavItem } from '@/core/notices';
import { accountNavItem } from '@/core/account';

const icon = (node: ReactNode) => node;

/** 피아노 사이드바 섹션 */
export function getPianoSidebarSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    buildDashboardNavSection(),
    buildCustomerNavSection(labels),
    buildClassAttendanceNavSection(labels, {
      sectionTitle: '수업 및 출결',
      extraItems: [
        { tab: 'makeups', label: '보강 수업', icon: icon(<Sparkles className="w-4 h-4" />) },
        { tab: 'curriculum', label: '커리큘럼·진도', icon: icon(<BookOpen className="w-4 h-4" />) },
      ],
    }),
    buildNavSection('교육 및 일지', [
      { tab: 'lessons', label: '레슨 기록', icon: icon(<Piano className="w-4 h-4" />) },
      { tab: 'practice', label: '연습 기록', icon: icon(<BookOpenCheck className="w-4 h-4" />) },
      {
        tab: 'consultations',
        label: '상담 이력',
        icon: icon(<MessageSquareText className="w-4 h-4" />),
      },
      noticesNavItem('sm'),
      { tab: 'resources', label: '교재 및 곡 관리', icon: icon(<Music2 className="w-4 h-4" />) },
    ]),
    buildNavSection('수납 및 회계', [
      { tab: 'tuition', label: '수강료 및 수납', icon: icon(<CreditCard className="w-4 h-4" />) },
      { tab: 'unpaid', label: '미납 통합 관리', icon: icon(<AlertCircle className="w-4 h-4" />) },
      {
        tab: 'textbooks',
        label: '교재 판매 및 교재비',
        icon: icon(<BookOpen className="w-4 h-4" />),
      },
    ]),
    buildFinanceNavSection(),
    buildNavSection('학원 운영', [
      {
        tab: 'teachers',
        label: labels.staff.management,
        icon: icon(<GraduationCap className="w-4 h-4" />),
      },
      { tab: 'calendar', label: '학원 캘린더', icon: icon(<Calendar className="w-4 h-4" />) },
      { tab: 'recitals', label: '연주회·콩쿠르', icon: icon(<Award className="w-4 h-4" />) },
      { tab: 'settings', label: '학원 설정', icon: icon(<Settings className="w-4 h-4" />) },
      accountNavItem('sm'),
    ]),
  ];
}

/** 피아노 하단 메인 탭 */
export function getPianoMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '대시보드', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'timetable', label: labels.schedule.singular, icon: icon(<Clock className="w-5 h-5" />) },
    { tab: 'attendance', label: '출입', icon: icon(<CheckSquare className="w-5 h-5" />) },
  ];
}

/** 피아노 하단 더보기 탭 */
export function getPianoMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'tuition', label: '수강료/수납', icon: icon(<CreditCard className="w-5 h-5" />) },
    { tab: 'unpaid', label: '미납 통합', icon: icon(<AlertCircle className="w-5 h-5" />) },
    { tab: 'makeups', label: '보강 수업', icon: icon(<Sparkles className="w-5 h-5" />) },
    { tab: 'curriculum', label: '커리큘럼·진도', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'textbooks', label: '교재/재고 관리', icon: icon(<BookOpen className="w-5 h-5" />) },
    ...buildFinanceMoreTabs(),
    {
      tab: 'parents',
      label: labels.contact.management,
      icon: icon(<UserSquare2 className="w-5 h-5" />),
    },
    {
      tab: 'classes',
      label: labels.service.management,
      icon: icon(<GraduationCap className="w-5 h-5" />),
    },
    { tab: 'lessons', label: '레슨 기록', icon: icon(<Piano className="w-5 h-5" />) },
    { tab: 'practice', label: '연습 기록', icon: icon(<BookOpenCheck className="w-5 h-5" />) },
    {
      tab: 'consultations',
      label: '상담 이력',
      icon: icon(<MessageSquareText className="w-5 h-5" />),
    },
    noticesNavItem('lg'),
    { tab: 'resources', label: '교재/곡 자료실', icon: icon(<Music2 className="w-5 h-5" />) },
    {
      tab: 'teachers',
      label: labels.staff.management,
      icon: icon(<GraduationCap className="w-5 h-5" />),
    },
    { tab: 'calendar', label: '학원 캘린더', icon: icon(<Calendar className="w-5 h-5" />) },
    { tab: 'recitals', label: '연주회·콩쿠르', icon: icon(<Award className="w-5 h-5" />) },
    { tab: 'settings', label: '학원 설정', icon: icon(<Settings className="w-5 h-5" />) },
    accountNavItem('lg'),
  ];
}
