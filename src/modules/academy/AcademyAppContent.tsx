import React from 'react';
import { useApp } from '@/context/AppContext';
import { useTabGuard } from '@/core/auth/useTabGuard';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
import { AcademySidebar } from './layout/AcademySidebar';
import { AcademyBottomNav } from './layout/AcademyBottomNav';
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
export const AcademyAppContent: React.FC = () => {
  const { activeTab } = useApp();
  useTabGuard();

  const View = ACADEMY_VIEWS[activeTab] ?? AcademyDashboardView;

  return (
    <ModuleAppShell sidebar={<AcademySidebar />} bottomNav={<AcademyBottomNav />}>
      <View />
    </ModuleAppShell>
  );
};
