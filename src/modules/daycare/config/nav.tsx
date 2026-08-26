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
  GraduationCap,
  Calendar,
  Settings,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Receipt,
  MessageSquareText,
  BookOpen,
  Pill,
  Megaphone,
} from 'lucide-react';

const icon = (node: ReactNode) => node;

export function getDaycareSidebarSections(labels: ModuleLabels): NavMenuSection[] {
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
      title: labels.service.section ?? '반·출결',
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
        { tab: 'attendance', label: '등·하원 관리', icon: icon(<CheckSquare className="w-4 h-4" />) },
      ],
    },
    {
      title: '보육 기록',
      items: [
        { tab: 'journals', label: '알림장', icon: icon(<BookOpen className="w-4 h-4" />) },
        { tab: 'medications', label: '투약 관리', icon: icon(<Pill className="w-4 h-4" />) },
        {
          tab: 'notices',
          label: '가정통신문',
          icon: icon(<Megaphone className="w-4 h-4" />),
        },
        {
          tab: 'consultations',
          label: '상담 이력',
          icon: icon(<MessageSquareText className="w-4 h-4" />),
        },
      ],
    },
    {
      title: '수납',
      items: [
        { tab: 'tuition', label: '보육료 및 수납', icon: icon(<CreditCard className="w-4 h-4" />) },
        { tab: 'unpaid', label: '미납 통합 관리', icon: icon(<AlertCircle className="w-4 h-4" />) },
      ],
    },
    {
      title: labels.staff.section ?? '보육 인력',
      items: [
        {
          tab: 'teachers',
          label: labels.staff.management,
          icon: icon(<GraduationCap className="w-4 h-4" />),
        },
        { tab: 'calendar', label: '원 캘린더', icon: icon(<Calendar className="w-4 h-4" />) },
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
      items: [{ tab: 'settings', label: '어린이집 설정', icon: icon(<Settings className="w-4 h-4" />) }],
    },
  ];
}

export function getDaycareMainTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'dashboard', label: '홈', icon: icon(<LayoutDashboard className="w-5 h-5" />) },
    { tab: 'students', label: labels.customer.singular, icon: icon(<Users className="w-5 h-5" />) },
    { tab: 'journals', label: '알림장', icon: icon(<BookOpen className="w-5 h-5" />) },
  ];
}

export function getDaycareMoreTabs(labels: ModuleLabels): NavMenuItem[] {
  return [
    { tab: 'attendance', label: '등하원', icon: icon(<CheckSquare className="w-5 h-5" />) },
    { tab: 'medications', label: '투약', icon: icon(<Pill className="w-5 h-5" />) },
    { tab: 'notices', label: '가정통신문', icon: icon(<Megaphone className="w-5 h-5" />) },
    { tab: 'parents', label: labels.contact.management, icon: icon(<UserSquare2 className="w-5 h-5" />) },
    { tab: 'classes', label: '반 관리', icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'timetable', label: '시간표', icon: icon(<Clock className="w-5 h-5" />) },
    {
      tab: 'consultations',
      label: '상담 이력',
      icon: icon(<MessageSquareText className="w-5 h-5" />),
    },
    { tab: 'tuition', label: '보육료/수납', icon: icon(<CreditCard className="w-5 h-5" />) },
    { tab: 'unpaid', label: '미납 통합', icon: icon(<AlertCircle className="w-5 h-5" />) },
    { tab: 'teachers', label: labels.staff.singular, icon: icon(<GraduationCap className="w-5 h-5" />) },
    { tab: 'calendar', label: '캘린더', icon: icon(<Calendar className="w-5 h-5" />) },
    { tab: 'finance', label: '재무 요약', icon: icon(<BarChart3 className="w-5 h-5" />) },
    { tab: 'income', label: '수입', icon: icon(<TrendingUp className="w-5 h-5" />) },
    { tab: 'expenses', label: '지출', icon: icon(<Receipt className="w-5 h-5" />) },
    { tab: 'settings', label: '설정', icon: icon(<Settings className="w-5 h-5" />) },
  ];
}
