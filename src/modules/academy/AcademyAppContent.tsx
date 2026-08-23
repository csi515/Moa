import React from 'react';
import { ModuleViewRouter } from '@/shared/components/layout/ModuleViewRouter';
import { IndustryModuleSidebar } from '@/shared/components/layout/IndustryModuleSidebar';
import { IndustryModuleBottomNav } from '@/shared/components/layout/IndustryModuleBottomNav';
import { useModuleLabels } from '@/modules/piano';
import { AcademyDashboardView } from './components/dashboard/AcademyDashboardView';
import { HomeworkManagementView } from './components/homework/HomeworkManagementView';
import { ExamManagementView } from './components/exams/ExamManagementView';
import {
  ExpenseManagementView,
  FinanceOverviewView,
  IncomeManagementView,
} from '@/core/finance';
import { AttendanceManagementView } from '@/core/attendance';
import { ProductManagementView } from '@/core/products';
import {
  StudentListView,
  WeeklyTimetableView,
  TuitionManagementView,
  UnpaidManagementView,
  MakeupManagementView,
  ClassManagementView,
  ParentManagementView,
  ConsultationRecordsView,
  TeacherManagementView,
  AcademyCalendarView,
  AcademySettingsView,
} from '@/modules/piano';
import { buildAcademyNavSections, buildAcademyBottomNavTabs } from './config/nav';

const ACADEMY_VIEWS: Record<string, React.FC> = {
  dashboard: AcademyDashboardView,
  students: StudentListView,
  attendance: AttendanceManagementView,
  timetable: WeeklyTimetableView,
  tuition: TuitionManagementView,
  unpaid: UnpaidManagementView,
  makeups: MakeupManagementView,
  homework: HomeworkManagementView,
  exams: ExamManagementView,
  products: ProductManagementView,
  finance: FinanceOverviewView,
  income: IncomeManagementView,
  expenses: ExpenseManagementView,
  classes: ClassManagementView,
  parents: ParentManagementView,
  consultations: ConsultationRecordsView,
  teachers: TeacherManagementView,
  calendar: AcademyCalendarView,
  settings: AcademySettingsView,
};

/** 종합학원 앱 셸 */
export const AcademyAppContent: React.FC = () => (
  <ModuleViewRouter
    views={ACADEMY_VIEWS}
    fallback={AcademyDashboardView}
    theme="indigo"
    sidebar={
      <IndustryModuleSidebar
        buildSections={buildAcademyNavSections}
        useLabels={useModuleLabels}
        theme="indigo"
      />
    }
    bottomNav={
      <IndustryModuleBottomNav
        buildTabs={buildAcademyBottomNavTabs}
        useLabels={useModuleLabels}
        moreMenuSubtitle="종합학원 운영 메뉴를 선택하세요"
        theme="indigo"
      />
    }
  />
);
