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
import { GymSidebar } from './layout/GymSidebar';
import { GymBottomNav } from './layout/GymBottomNav';
import { GymDashboardView } from './components/dashboard/GymDashboardView';
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
} from '@/core/academy';
import {
  accountViewEntry,
  attendanceViewEntry,
  financeViewEntries,
} from '@/core/industry/commonViewEntries';
import { noticesViewEntry } from '@/core/notices';

const GYM_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <GymDashboardView />,
  students: () => <StudentListView />,
  parents: () => <ParentManagementView />,
  classes: () => <ClassManagementView />,
  timetable: () => <WeeklyTimetableView />,
  ...attendanceViewEntry,
  ...noticesViewEntry,
  tuition: () => <TuitionManagementView />,
  unpaid: () => <UnpaidManagementView />,
  teachers: () => <TeacherManagementView />,
  calendar: () => <AcademyCalendarView />,
  ...financeViewEntries,
  settings: () => <AcademySettingsView />,
  ...accountViewEntry,
};

export const GymAppContent: FC = () => {
  const { activeTab } = useApp();
  const { isOwner } = usePermissions();

  useTabGuard();

  const renderView = GYM_VIEW_MAP[activeTab] ?? GYM_VIEW_MAP.dashboard;

  return (
    <ModuleAppShell
      theme="orange"
      beforeHeader={isSupabaseConfigured() ? <SupabaseRoleSync /> : null}
      sidebar={<GymSidebar />}
      bottomNav={<GymBottomNav />}
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
