import React from 'react';
import { useApp } from '@/context/AppContext';
import { useTabGuard } from '@/core/auth/useTabGuard';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
import { PianoSidebar } from './layout/PianoSidebar';
import { PianoBottomNav } from './layout/PianoBottomNav';
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
} from './index';

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

export const PianoAppContent: React.FC = () => {
  const { activeTab } = useApp();
  useTabGuard();

  const View = PIANO_VIEWS[activeTab] ?? DashboardView;

  return (
    <ModuleAppShell
      theme="indigo"
      sidebar={<PianoSidebar />}
      bottomNav={<PianoBottomNav />}
    >
      <View />
    </ModuleAppShell>
  );
};
