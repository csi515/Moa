import type { ReactNode } from 'react';
import type { ModuleLabels } from './labels';
import type { NavMenuItem, NavMenuSection } from '@/core/auth/navUtils';
import { buildNavSection } from '@/core/auth/navBuilders';
import {
  Award,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CheckSquare,
  Fingerprint,
  GraduationCap,
  LayoutDashboard,
  MessageSquareText,
  Music2,
  Piano,
  Settings,
  Users,
} from 'lucide-react';

const icon = (node: ReactNode) => node;

/**
 * Core: 홈·학생·일정·출결(등원)·상담·수납 · 설정
 * 레슨은 모바일「오늘」· PIN 출석은 더보기
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
      { tab: 'finance', label: '수납', icon: icon(<BarChart3 className="w-4 h-4" />) },
      {
        tab: 'song-stamps',
        label: '완곡 스탬프',
        icon: icon(<Music2 className="w-4 h-4" />),
      },
    ]),
    buildNavSection('설정', [
      { tab: 'settings', label: '설정', icon: icon(<Settings className="w-4 h-4" />) },
    ]),
  ];
}

/** 모바일: 홈 · 학생 · 오늘(레슨) · 일정 (출결·수납·상담은 더보기) */
export function getPianoMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'lessons', label: '오늘', icon: icon(<Piano className="w-5 h-5" />) },
    { tab: 'timetable', label: '일정', icon: icon(<CalendarDays className="w-5 h-5" />) },
  ];
}

/** 더보기: 출결·상담·수납·설정·정규 레슨·PIN 출석·교육 부가 */
export function getPianoMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'attendance', label: '출결', icon: icon(<CheckSquare className="w-5 h-5" />) },
    {
      tab: 'consultations',
      label: '상담',
      icon: icon(<MessageSquareText className="w-5 h-5" />),
    },
    { tab: 'finance', label: '수납', icon: icon(<BarChart3 className="w-5 h-5" />) },
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
    {
      tab: 'classes',
      label: labels.service.singular,
      icon: icon(<GraduationCap className="w-5 h-5" />),
    },
    {
      tab: 'check-in',
      label: 'PIN 출석',
      icon: icon(<Fingerprint className="w-5 h-5" />),
    },
    {
      tab: 'assignments',
      label: '과제',
      icon: icon(<BookOpenCheck className="w-5 h-5" />),
    },
    {
      tab: 'practice',
      label: '연습',
      icon: icon(<BookOpenCheck className="w-5 h-5" />),
    },
    {
      tab: 'practice-rooms',
      label: '연습실 예약',
      icon: icon(<Music2 className="w-5 h-5" />),
    },
    { tab: 'textbooks', label: '교재 관리', icon: icon(<BookOpen className="w-5 h-5" />) },
    // 교재·곡 자료(resources): UI 숨김. Song(resourceType)과 textbooks(판매)는 별 도메인 — 통합 보류.
    // ResourceManagementView·VIEW_MAP·SONGS 스토리지는 데이터 보존용으로 유지.
    { tab: 'recitals', label: '연주회', icon: icon(<Award className="w-5 h-5" />) },
    { tab: 'curriculum', label: '커리큘럼', icon: icon(<BookOpen className="w-5 h-5" />) },
    { tab: 'achievements', label: '시험·등급', icon: icon(<Award className="w-5 h-5" />) },
    { tab: 'song-stamps', label: '완곡 스탬프', icon: icon(<Music2 className="w-5 h-5" />) },
    { tab: 'reports', label: '리포트', icon: icon(<BarChart3 className="w-5 h-5" />) },
  ];
}
