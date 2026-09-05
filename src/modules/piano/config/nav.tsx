import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import { buildFinanceNavItem, buildNavSection } from '@/core/auth/navBuilders';
import {
  Award,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Music2,
  Settings,
  Users,
} from 'lucide-react';

const icon = (node: ReactNode) => node;

/**
 * Core: 홈·고객·일정·출결·상담·재무 · 설정
 * 레슨·보강은 일정 허브 세그먼트, 부가 기능은 설정>부가
 */
export function getPianoSidebarSections(labels: ModuleLabels): NavMenuSection[] {
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

/** 모바일: 홈 · 고객 · 일정 · 재무 */
export function getPianoMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'timetable', label: '일정', icon: icon(<CalendarDays className="w-5 h-5" />) },
    buildFinanceNavItem('md'),
  ];
}

/** 더보기: 상담·출결·설정·반·부가 */
export function getPianoMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    {
      tab: 'consultations',
      label: '상담',
      icon: icon(<MessageSquareText className="w-5 h-5" />),
    },
    { tab: 'attendance', label: '출결', icon: icon(<CheckSquare className="w-5 h-5" />) },
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
    {
      tab: 'classes',
      label: labels.service.singular,
      icon: icon(<GraduationCap className="w-5 h-5" />),
    },
    {
      tab: 'assignments',
      label: '과제',
      icon: icon(<BookOpenCheck className="w-5 h-5" />),
    },
    { tab: 'practice', label: '연습', icon: icon(<BookOpenCheck className="w-5 h-5" />) },
    { tab: 'textbooks', label: '교재', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'resources', label: '자료', icon: icon(<Music2 className="w-5 h-5" />) },
    { tab: 'recitals', label: '연주회', icon: icon(<Award className="w-5 h-5" />) },
    { tab: 'curriculum', label: '커리큘럼', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'achievements', label: '시험·등급', icon: icon(<Award className="w-5 h-5" />) },
    { tab: 'reports', label: '리포트', icon: icon(<BarChart3 className="w-5 h-5" />) },
  ];
}
