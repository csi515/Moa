import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import {
  buildFinanceMoreTabs,
  buildNavSection,
} from '@/core/auth/navBuilders';
import {
  AlertCircle,
  Award,
  BarChart3,
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
  Receipt,
  Settings,
  Sparkles,
  TrendingUp,
  UserSquare2,
  Users,
} from 'lucide-react';
import { noticesNavItem } from '@/core/notices';
import { accountNavItem } from '@/core/account';

const icon = (node: ReactNode) => node;

/**
 * 피아노 사이드바 — 원장 핵심 업무 우선
 * 홈 / 학생 / 일정 / 출결 / 상담 / 수납 / 설정
 * (교육 품질·재무 등은 숨기거나 설정·추가 기능으로 이동, 기능 코드는 유지)
 */
export function getPianoSidebarSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    buildNavSection('홈', [
      { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-4 h-4" />) },
    ]),
    buildNavSection('학생', [
      {
        tab: 'students',
        label: labels.customer.management,
        icon: icon(<Users className="w-4 h-4" />),
      },
      {
        tab: 'parents',
        label: labels.contact.management,
        icon: icon(<UserSquare2 className="w-4 h-4" />),
      },
    ]),
    buildNavSection('일정', [
      {
        tab: 'timetable',
        label: labels.schedule.management,
        icon: icon(<Clock className="w-4 h-4" />),
      },
      {
        tab: 'classes',
        label: labels.service.management,
        icon: icon(<GraduationCap className="w-4 h-4" />),
      },
      { tab: 'calendar', label: '학원 캘린더', icon: icon(<Calendar className="w-4 h-4" />) },
      { tab: 'curriculum', label: '커리큘럼·진도', icon: icon(<BookOpen className="w-4 h-4" />) },
    ]),
    buildNavSection('출결', [
      { tab: 'attendance', label: '출입 관리', icon: icon(<CheckSquare className="w-4 h-4" />) },
      { tab: 'makeups', label: '보강 수업', icon: icon(<Sparkles className="w-4 h-4" />) },
    ]),
    buildNavSection('상담', [
      {
        tab: 'consultations',
        label: '상담',
        icon: icon(<MessageSquareText className="w-4 h-4" />),
      },
    ]),
    buildNavSection('수납', [
      { tab: 'tuition', label: '수강료 및 수납', icon: icon(<CreditCard className="w-4 h-4" />) },
      { tab: 'unpaid', label: '미납 관리', icon: icon(<AlertCircle className="w-4 h-4" />) },
    ]),
    buildNavSection('설정', [
      { tab: 'settings', label: '학원 설정', icon: icon(<Settings className="w-4 h-4" />) },
      accountNavItem('sm'),
      {
        tab: 'teachers',
        label: labels.staff.management,
        icon: icon(<GraduationCap className="w-4 h-4" />),
      },
      noticesNavItem('sm'),
    ]),
    buildNavSection('추가 기능', [
      { tab: 'lessons', label: '레슨 기록', icon: icon(<Piano className="w-4 h-4" />) },
      { tab: 'practice', label: '연습 기록', icon: icon(<BookOpenCheck className="w-4 h-4" />) },
      {
        tab: 'textbooks',
        label: '교재 판매',
        icon: icon(<BookOpen className="w-4 h-4" />),
      },
      { tab: 'resources', label: '교재·곡 자료', icon: icon(<Music2 className="w-4 h-4" />) },
      { tab: 'recitals', label: '연주회·콩쿠르', icon: icon(<Award className="w-4 h-4" />) },
      { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-4 h-4" />) },
      { tab: 'income', label: '수입 관리', icon: icon(<TrendingUp className="w-4 h-4" />) },
      { tab: 'expenses', label: '지출 관리', icon: icon(<Receipt className="w-4 h-4" />) },
    ]),
  ];
}

/** 피아노 하단 메인 탭: 홈 · 학생 · 일정 · 출결 */
export function getPianoMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'timetable', label: labels.schedule.singular, icon: icon(<Clock className="w-5 h-5" />) },
    { tab: 'attendance', label: '출결', icon: icon(<CheckSquare className="w-5 h-5" />) },
  ];
}

/**
 * 모바일 더보기 — 상담·수납·설정을 앞세우고,
 * 주간 과제·시험·학습리포트는 메뉴에서 숨김(기능 코드 유지)
 */
export function getPianoMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    {
      tab: 'consultations',
      label: '상담',
      icon: icon(<MessageSquareText className="w-5 h-5" />),
    },
    { tab: 'tuition', label: '수납', icon: icon(<CreditCard className="w-5 h-5" />) },
    { tab: 'unpaid', label: '미납', icon: icon(<AlertCircle className="w-5 h-5" />) },
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
    {
      tab: 'parents',
      label: labels.contact.singular,
      icon: icon(<UserSquare2 className="w-5 h-5" />),
    },
    {
      tab: 'classes',
      label: labels.service.singular,
      icon: icon(<GraduationCap className="w-5 h-5" />),
    },
    { tab: 'makeups', label: '보강', icon: icon(<Sparkles className="w-5 h-5" />) },
    { tab: 'calendar', label: '캘린더', icon: icon(<Calendar className="w-5 h-5" />) },
    { tab: 'curriculum', label: '커리큘럼', icon: icon(<BookOpen className="w-5 h-5" />) },
    {
      tab: 'teachers',
      label: labels.staff.singular,
      icon: icon(<GraduationCap className="w-5 h-5" />),
    },
    noticesNavItem('lg'),
    accountNavItem('lg'),
    { tab: 'lessons', label: '레슨', icon: icon(<Piano className="w-5 h-5" />) },
    { tab: 'practice', label: '연습', icon: icon(<BookOpenCheck className="w-5 h-5" />) },
    { tab: 'textbooks', label: '교재', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'resources', label: '자료', icon: icon(<Music2 className="w-5 h-5" />) },
    { tab: 'recitals', label: '연주회', icon: icon(<Award className="w-5 h-5" />) },
    ...buildFinanceMoreTabs(),
  ];
}
