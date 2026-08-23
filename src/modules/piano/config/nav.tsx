import type { NavMenuSection, NavMenuItem } from '@/core/auth/navUtils';
import type { ModuleLabels } from './labels';
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
  Package,
} from 'lucide-react';

export function buildPianoNavSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    {
      title: '메인',
      items: [
        { tab: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-4 h-4" /> },
      ],
    },
    {
      title: labels.customer.section,
      items: [
        { tab: 'students', label: labels.customer.management, icon: <Users className="w-4 h-4" /> },
        {
          tab: 'parents',
          label: labels.contact.management,
          icon: <UserSquare2 className="w-4 h-4" />,
        },
      ],
    },
    {
      title: '수업 및 출결',
      items: [
        {
          tab: 'classes',
          label: labels.service.management,
          icon: <GraduationCap className="w-4 h-4" />,
        },
        {
          tab: 'timetable',
          label: labels.schedule.management,
          icon: <Clock className="w-4 h-4" />,
        },
        { tab: 'attendance', label: '출결 관리', icon: <CheckSquare className="w-4 h-4" /> },
        { tab: 'makeups', label: '보강 수업', icon: <Sparkles className="w-4 h-4" /> },
      ],
    },
    {
      title: '교육 및 일지',
      items: [
        { tab: 'lessons', label: '레슨 기록', icon: <Piano className="w-4 h-4" /> },
        { tab: 'practice', label: '연습 기록', icon: <BookOpenCheck className="w-4 h-4" /> },
        {
          tab: 'consultations',
          label: '상담 이력',
          icon: <MessageSquareText className="w-4 h-4" />,
        },
        { tab: 'resources', label: '교재 및 곡 관리', icon: <Music2 className="w-4 h-4" /> },
      ],
    },
    {
      title: '수납 및 회계',
      items: [
        { tab: 'tuition', label: '수강료 및 수납', icon: <CreditCard className="w-4 h-4" /> },
        { tab: 'unpaid', label: '미납 통합 관리', icon: <AlertCircle className="w-4 h-4" /> },
        { tab: 'textbooks', label: '교재 판매 및 교재비', icon: <BookOpen className="w-4 h-4" /> },
        { tab: 'products', label: '상품 관리', icon: <Package className="w-4 h-4" /> },
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
      title: '교육 품질',
      items: [
        { tab: 'curriculum', label: '커리큘럼·진도', icon: <BookOpen className="w-4 h-4" /> },
        { tab: 'assignments', label: '주간 과제', icon: <BookOpenCheck className="w-4 h-4" /> },
        { tab: 'achievements', label: '시험·콩쿠르', icon: <Award className="w-4 h-4" /> },
        { tab: 'reports', label: '학습 리포트', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      title: '학원 운영',
      items: [
        {
          tab: 'teachers',
          label: labels.staff.management,
          icon: <GraduationCap className="w-4 h-4" />,
        },
        { tab: 'calendar', label: '학원 캘린더', icon: <Calendar className="w-4 h-4" /> },
        { tab: 'recitals', label: '연주회·콩쿠르', icon: <Award className="w-4 h-4" /> },
        { tab: 'settings', label: '학원 설정', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];
}

export function buildPianoBottomNavTabs(labels: ModuleLabels): {
  mainTabs: NavMenuItem[];
  moreTabs: NavMenuItem[];
} {
  return {
    mainTabs: [
      { tab: 'dashboard', label: '대시보드', icon: <LayoutDashboard className="w-5 h-5" /> },
      { tab: 'students', label: labels.customer.singular, icon: <Users className="w-5 h-5" /> },
      { tab: 'timetable', label: labels.schedule.singular, icon: <Clock className="w-5 h-5" /> },
      { tab: 'attendance', label: '출결', icon: <CheckSquare className="w-5 h-5" /> },
    ],
    moreTabs: [
      { tab: 'tuition', label: '수강료/수납', icon: <CreditCard className="w-5 h-5" /> },
      { tab: 'unpaid', label: '미납 통합', icon: <AlertCircle className="w-5 h-5" /> },
      { tab: 'makeups', label: '보강 수업', icon: <Sparkles className="w-5 h-5" /> },
      { tab: 'textbooks', label: '교재/재고 관리', icon: <BookOpen className="w-5 h-5" /> },
      { tab: 'products', label: '상품 관리', icon: <Package className="w-5 h-5" /> },
      { tab: 'finance', label: '재무 요약', icon: <BarChart3 className="w-5 h-5" /> },
      { tab: 'income', label: '수입 관리', icon: <TrendingUp className="w-5 h-5" /> },
      { tab: 'expenses', label: '지출 관리', icon: <Receipt className="w-5 h-5" /> },
      { tab: 'parents', label: labels.contact.management, icon: <UserSquare2 className="w-5 h-5" /> },
      { tab: 'classes', label: labels.service.management, icon: <GraduationCap className="w-5 h-5" /> },
      { tab: 'lessons', label: '레슨 기록', icon: <Piano className="w-5 h-5" /> },
      { tab: 'practice', label: '연습 기록', icon: <BookOpenCheck className="w-5 h-5" /> },
      {
        tab: 'consultations',
        label: '상담 이력',
        icon: <MessageSquareText className="w-5 h-5" />,
      },
      { tab: 'resources', label: '교재/곡 자료실', icon: <Music2 className="w-5 h-5" /> },
      { tab: 'teachers', label: labels.staff.management, icon: <GraduationCap className="w-5 h-5" /> },
      { tab: 'calendar', label: '학원 캘린더', icon: <Calendar className="w-5 h-5" /> },
      { tab: 'recitals', label: '연주회·콩쿠르', icon: <Award className="w-5 h-5" /> },
      { tab: 'curriculum', label: '커리큘럼·진도', icon: <BookOpen className="w-5 h-5" /> },
      { tab: 'assignments', label: '주간 과제', icon: <BookOpenCheck className="w-5 h-5" /> },
      { tab: 'achievements', label: '시험·콩쿠르', icon: <Award className="w-5 h-5" /> },
      { tab: 'reports', label: '학습 리포트', icon: <FileText className="w-5 h-5" /> },
      { tab: 'settings', label: '학원 설정', icon: <Settings className="w-5 h-5" /> },
    ],
  };
}
