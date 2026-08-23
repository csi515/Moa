import React from 'react';
import { ModuleViewRouter } from '@/shared/components/layout/ModuleViewRouter';
import { IndustryModuleSidebar } from '@/shared/components/layout/IndustryModuleSidebar';
import { IndustryModuleBottomNav } from '@/shared/components/layout/IndustryModuleBottomNav';
import {
  ExpenseManagementView,
  FinanceOverviewView,
  IncomeManagementView,
} from '@/core/finance';
import { AttendanceManagementView } from '@/core/attendance';
import { ProductManagementView } from '@/core/products';
import {
  DashboardView,
  StudentListView,
  WeeklyTimetableView,
  TuitionManagementView,
  UnpaidManagementView,
  MakeupManagementView,
  RecitalManagementView,
  TextbookManagementView,
  ClassManagementView,
  ParentManagementView,
  LessonRecordsView,
  PracticeRecordsView,
  ConsultationRecordsView,
  ResourceManagementView,
  TeacherManagementView,
  AcademyCalendarView,
  AcademySettingsView,
  CurriculumManagementView,
  AssignmentsManagementView,
  AchievementsManagementView,
  ReportsManagementView,
  useModuleLabels,
} from './index';
import { buildPianoNavSections, buildPianoBottomNavTabs } from './config/nav';

const PIANO_VIEWS: Record<string, React.FC> = {
  dashboard: DashboardView,
  students: StudentListView,
  attendance: AttendanceManagementView,
  timetable: WeeklyTimetableView,
  tuition: TuitionManagementView,
  unpaid: UnpaidManagementView,
  makeups: MakeupManagementView,
  textbooks: TextbookManagementView,
  products: ProductManagementView,
  finance: FinanceOverviewView,
  income: IncomeManagementView,
  expenses: ExpenseManagementView,
  classes: ClassManagementView,
  parents: ParentManagementView,
  lessons: LessonRecordsView,
  practice: PracticeRecordsView,
  consultations: ConsultationRecordsView,
  resources: ResourceManagementView,
  teachers: TeacherManagementView,
  calendar: AcademyCalendarView,
  recitals: RecitalManagementView,
  curriculum: CurriculumManagementView,
  assignments: AssignmentsManagementView,
  achievements: AchievementsManagementView,
  reports: ReportsManagementView,
  settings: AcademySettingsView,
};

export const PianoAppContent: React.FC = () => (
  <ModuleViewRouter
    views={PIANO_VIEWS}
    fallback={DashboardView}
    theme="indigo"
    sidebar={
      <IndustryModuleSidebar
        buildSections={buildPianoNavSections}
        useLabels={useModuleLabels}
        theme="indigo"
      />
    }
    bottomNav={
      <IndustryModuleBottomNav
        buildTabs={buildPianoBottomNavTabs}
        useLabels={useModuleLabels}
        moreMenuSubtitle="피아노 학원 운영 메뉴를 선택하세요"
        theme="indigo"
      />
    }
  />
);
