import type { NavMenuSection, NavMenuItem } from '@/core/auth/navUtils';
import type { ModuleLabels } from '@/modules/piano/config/labels';
import {
  mainDashboardSection,
  academyCustomerSection,
  academyClassAttendanceSection,
  academyTuitionSection,
  financeNavSection,
  academyOperationsSection,
  academyStyleBottomMainTabs,
  academyStyleBottomSharedMoreTabs,
} from '@/core/auth/navPresets';
import {
  MessageSquareText,
  BookOpenCheck,
  ClipboardList,
} from 'lucide-react';

/** 종합학원 사이드바 섹션 (권한 필터 전) */
export function buildAcademyNavSections(labels: ModuleLabels): NavMenuSection[] {
  return [
    mainDashboardSection('sm'),
    academyCustomerSection(labels, 'sm'),
    academyClassAttendanceSection(labels, 'sm'),
    {
      title: '학습 관리',
      items: [
        { tab: 'homework', label: '숙제 관리', icon: <BookOpenCheck className="w-4 h-4" /> },
        { tab: 'exams', label: '시험·점수', icon: <ClipboardList className="w-4 h-4" /> },
        {
          tab: 'consultations',
          label: '상담 이력',
          icon: <MessageSquareText className="w-4 h-4" />,
        },
      ],
    },
    academyTuitionSection('sm', '학습 교재·문구'),
    financeNavSection('sm'),
    academyOperationsSection(labels, 'sm'),
  ];
}

export function buildAcademyBottomNavTabs(labels: ModuleLabels): {
  mainTabs: NavMenuItem[];
  moreTabs: NavMenuItem[];
} {
  const shared = academyStyleBottomSharedMoreTabs(labels, {
    productsLabel: '학습 교재·문구',
    includeClasses: true,
  });

  const homeworkExams: NavMenuItem[] = [
    { tab: 'homework', label: '숙제', icon: <BookOpenCheck className="w-5 h-5" /> },
    { tab: 'exams', label: '시험·점수', icon: <ClipboardList className="w-5 h-5" /> },
  ];

  const consultations: NavMenuItem = {
    tab: 'consultations',
    label: '상담 이력',
    icon: <MessageSquareText className="w-5 h-5" />,
  };

  const makeupsIdx = shared.findIndex((item) => item.tab === 'makeups');
  const insertAt = makeupsIdx >= 0 ? makeupsIdx + 1 : 3;
  const moreTabs = [
    ...shared.slice(0, insertAt),
    ...homeworkExams,
    consultations,
    ...shared.slice(insertAt),
  ];

  return {
    mainTabs: academyStyleBottomMainTabs(labels),
    moreTabs,
  };
}
