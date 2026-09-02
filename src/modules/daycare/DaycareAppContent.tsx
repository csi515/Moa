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
import { DaycareSidebar } from './layout/DaycareSidebar';
import { DaycareBottomNav } from './layout/DaycareBottomNav';
import { DaycareDashboardView } from './components/dashboard/DaycareDashboardView';
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
  ConsultationRecordsView,
} from '@/modules/piano';
import {
  FinanceOverviewView,
  ExpenseManagementView,
  IncomeManagementView,
} from '@/core/finance';
import { AttendanceManagementView } from '@/core/attendance';
import { CareJournalView, MedicationRequestView } from './care';
import { noticesViewEntry } from '@/core/notices';
import { MyAccountView } from '@/core/account';

/**
 * 어린이집 플러그인 셸.
 * 코어(원아·반·출결·수납·재무) + 보육 기록(알림장·투약·상담·가정통신문).
 */
const DAYCARE_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <DaycareDashboardView />,
  students: () => <StudentListView />,
  parents: () => <ParentManagementView />,
  classes: () => <ClassManagementView />,
  timetable: () => <WeeklyTimetableView />,
  attendance: () => <AttendanceManagementView />,
  journals: () => <CareJournalView />,
  medications: () => <MedicationRequestView />,
  ...noticesViewEntry,
  consultations: () => <ConsultationRecordsView />,
  tuition: () => <TuitionManagementView />,
  unpaid: () => <UnpaidManagementView />,
  teachers: () => <TeacherManagementView />,
  calendar: () => <AcademyCalendarView />,
  finance: () => <FinanceOverviewView />,
  income: () => <IncomeManagementView />,
  expenses: () => <ExpenseManagementView />,
  settings: () => <AcademySettingsView />,
  account: () => <MyAccountView />,
};

export const DaycareAppContent: FC = () => {
  const { activeTab } = useApp();
  const { isOwner } = usePermissions();

  useTabGuard();

  const renderView = DAYCARE_VIEW_MAP[activeTab] ?? DAYCARE_VIEW_MAP.dashboard;

  return (
    <ModuleAppShell
      theme="sky"
      beforeHeader={isSupabaseConfigured() ? <SupabaseRoleSync /> : null}
      sidebar={<DaycareSidebar />}
      bottomNav={<DaycareBottomNav />}
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
