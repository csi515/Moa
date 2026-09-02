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
  Receipt,
  MessageSquareText,
  BookOpenCheck,
  BookOpen,
  Piano,
  Music2,
  GraduationCap,
  Calendar,
  Settings,
  AlertCircle,
  Sparkles,
  Award,
  BarChart3,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { noticesNavItem } from '@/core/notices';
import { accountNavItem } from '@/core/account';

const icon = (node: ReactNode) => node;

/** 피아노 사이드바 섹션 */
export function getPianoSidebarSections(labels: ModuleLabels): NavMenuSection[] {
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
      title: '수업 및 출결',
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
        { tab: 'makeups', label: '보강 수업', icon: icon(<Sparkles className="w-4 h-4" />) },
      ],
    },
    {
      title: '교육 및 일지',
      items: [
        { tab: 'lessons', label: '레슨 기록', icon: icon(<Piano className="w-4 h-4" />) },
        { tab: 'practice', label: '연습 기록', icon: icon(<BookOpenCheck className="w-4 h-4" />) },
        {
          tab: 'consultations',
          label: '상담 이력',
          icon: icon(<MessageSquareText className="w-4 h-4" />),
        },
        noticesNavItem('sm'),
        { tab: 'resources', label: '교재 및 곡 관리', icon: icon(<Music2 className="w-4 h-4" />) },
      ],
    },
    {
      title: '수납 및 회계',
      items: [
        { tab: 'tuition', label: '수강료 및 수납', icon: icon(<CreditCard className="w-4 h-4" />) },
        { tab: 'unpaid', label: '미납 통합 관리', icon: icon(<AlertCircle className="w-4 h-4" />) },
        {
          tab: 'textbooks',
          label: '교재 판매 및 교재비',
          icon: icon(<BookOpen className="w-4 h-4" />),
        },
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
      title: '교육 품질',
      items: [
        { tab: 'curriculum', label: '커리큘럼·진도', icon: icon(<BookOpen className="w-4 h-4" />) },
        {
          tab: 'assignments',
          label: '주간 과제',
          icon: icon(<BookOpenCheck className="w-4 h-4" />),
        },
        { tab: 'achievements', label: '시험·콩쿠르', icon: icon(<Award className="w-4 h-4" />) },
        { tab: 'reports', label: '학습 리포트', icon: icon(<FileText className="w-4 h-4" />) },
      ],
    },
    {
      title: '학원 운영',
      items: [
        {
          tab: 'teachers',
          label: labels.staff.management,
          icon: icon(<GraduationCap className="w-4 h-4" />),
        },
        { tab: 'calendar', label: '학원 캘린더', icon: icon(<Calendar className="w-4 h-4" />) },
        { tab: 'recitals', label: '연주회·콩쿠르', icon: icon(<Award className="w-4 h-4" />) },
        { tab: 'settings', label: '학원 설정', icon: icon(<Settings className="w-4 h-4" />) },
        accountNavItem('sm'),
      ],
    },
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
    { tab: 'textbooks', label: '교재/재고 관리', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-5 h-5" />) },
    { tab: 'income', label: '수입 관리', icon: icon(<TrendingUp className="w-5 h-5" />) },
    { tab: 'expenses', label: '지출 관리', icon: icon(<Receipt className="w-5 h-5" />) },
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
    { tab: 'curriculum', label: '커리큘럼·진도', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'assignments', label: '주간 과제', icon: icon(<BookOpenCheck className="w-5 h-5" />) },
    { tab: 'achievements', label: '시험·콩쿠르', icon: icon(<Award className="w-5 h-5" />) },
    { tab: 'reports', label: '학습 리포트', icon: icon(<FileText className="w-5 h-5" />) },
    { tab: 'settings', label: '학원 설정', icon: icon(<Settings className="w-5 h-5" />) },
    accountNavItem('lg'),
  ];
}
