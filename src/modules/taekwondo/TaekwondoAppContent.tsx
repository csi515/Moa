import type { FC, ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useTabGuard } from '@/core/auth/useTabGuard';
import {
  PwaInstallPrompt,
  DirectorFloatingFab,
  ToastContainer,
  ConfirmDialog,
} from '@/shared/components';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { TaekwondoSidebar } from './layout/TaekwondoSidebar';
import { TaekwondoBottomNav } from './layout/TaekwondoBottomNav';
import { TaekwondoDashboardView } from './components/dashboard/TaekwondoDashboardView';
import { StudentListView } from './components/students/StudentListView';
import {
  WeeklyTimetableView,
  TuitionManagementView,
  UnpaidManagementView,
  ClassManagementView,
  ParentManagementView,
  TeacherManagementView,
  AcademyCalendarView,
  AcademySettingsView,
} from '@/modules/piano';
import {
  FinanceOverviewView,
  ExpenseManagementView,
  IncomeManagementView,
} from '@/core/finance';
import { AttendanceManagementView } from '@/core/attendance';

const TAEKWONDO_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <TaekwondoDashboardView />,
  students: () => <StudentListView />,
  parents: () => <ParentManagementView />,
  classes: () => <ClassManagementView />,
  timetable: () => <WeeklyTimetableView />,
  attendance: () => <AttendanceManagementView />,
  tuition: () => <TuitionManagementView />,
  unpaid: () => <UnpaidManagementView />,
  teachers: () => <TeacherManagementView />,
  calendar: () => <AcademyCalendarView />,
  finance: () => <FinanceOverviewView />,
  income: () => <IncomeManagementView />,
  expenses: () => <ExpenseManagementView />,
  settings: () => <AcademySettingsView />,
};

export const TaekwondoAppContent: FC = () => {
  const { activeTab } = useApp();
  const { isOwner } = usePermissions();

  useTabGuard();

  const renderView = TAEKWONDO_VIEW_MAP[activeTab] ?? TAEKWONDO_VIEW_MAP.dashboard;

  return (
    <ModuleAppShell
      theme="red"
      beforeHeader={isSupabaseConfigured() ? <SupabaseRoleSync /> : null}
      sidebar={<TaekwondoSidebar />}
      bottomNav={<TaekwondoBottomNav />}
      overlays={
        <>
          {isOwner && <DirectorFloatingFab />}
          <PwaInstallPrompt />
          <ConfirmDialog />
          <ToastContainer />
        </>
      }
    >
      {renderView()}
    </ModuleAppShell>
  );
};
