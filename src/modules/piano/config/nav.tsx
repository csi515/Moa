import type { NavMenuSection, NavMenuItem } from '@/core/auth/navUtils';
import type { ModuleLabels } from './labels';
import {
  mainDashboardSection,
  academyCustomerSection,
  academyClassAttendanceSection,
  financeNavSection,
  academyOperationsSection,
  academyStyleBottomMainTabs,
  academyStyleBottomSharedMoreTabs,
} from '@/core/auth/navPresets';
import {
  MessageSquareText,
  BookOpenCheck,
  BookOpen,
  Piano,
  Music2,
  CreditCard,
  AlertCircle,
  Award,
  FileText,
  Package,
} from 'lucide-react';

export function buildPianoNavSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    mainDashboardSection('sm'),
    academyCustomerSection(labels, 'sm'),
    academyClassAttendanceSection(labels, 'sm'),
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
    financeNavSection('sm'),
    {
      title: '교육 품질',
      items: [
        { tab: 'curriculum', label: '커리큘럼·진도', icon: <BookOpen className="w-4 h-4" /> },
        { tab: 'assignments', label: '주간 과제', icon: <BookOpenCheck className="w-4 h-4" /> },
        { tab: 'achievements', label: '시험·콩쿠르', icon: <Award className="w-4 h-4" /> },
        { tab: 'reports', label: '학습 리포트', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    academyOperationsSection(labels, 'sm', [
      { tab: 'recitals', label: '연주회·콩쿠르', icon: <Award className="w-4 h-4" /> },
    ]),
  ];
}

export function buildPianoBottomNavTabs(labels: ModuleLabels): {
  mainTabs: NavMenuItem[];
  moreTabs: NavMenuItem[];
} {
  const pianoMoreTabs: NavMenuItem[] = [
    { tab: 'textbooks', label: '교재/재고 관리', icon: <BookOpen className="w-5 h-5" /> },
    { tab: 'lessons', label: '레슨 기록', icon: <Piano className="w-5 h-5" /> },
    { tab: 'practice', label: '연습 기록', icon: <BookOpenCheck className="w-5 h-5" /> },
    {
      tab: 'consultations',
      label: '상담 이력',
      icon: <MessageSquareText className="w-5 h-5" />,
    },
    { tab: 'resources', label: '교재/곡 자료실', icon: <Music2 className="w-5 h-5" /> },
    { tab: 'recitals', label: '연주회·콩쿠르', icon: <Award className="w-5 h-5" /> },
    { tab: 'curriculum', label: '커리큘럼·진도', icon: <BookOpen className="w-5 h-5" /> },
    { tab: 'assignments', label: '주간 과제', icon: <BookOpenCheck className="w-5 h-5" /> },
    { tab: 'achievements', label: '시험·콩쿠르', icon: <Award className="w-5 h-5" /> },
    { tab: 'reports', label: '학습 리포트', icon: <FileText className="w-5 h-5" /> },
  ];

  const shared = academyStyleBottomSharedMoreTabs(labels, {
    productsLabel: '상품 관리',
    includeClasses: true,
  });

  const settingsIdx = shared.findIndex((item) => item.tab === 'settings');
  const moreTabs =
    settingsIdx >= 0
      ? [...shared.slice(0, settingsIdx), ...pianoMoreTabs, ...shared.slice(settingsIdx)]
      : [...shared, ...pianoMoreTabs];

  return {
    mainTabs: academyStyleBottomMainTabs(labels),
    moreTabs,
  };
}
