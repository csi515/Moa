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
import { PilatesSidebar } from './layout/PilatesSidebar';
import { PilatesBottomNav } from './layout/PilatesBottomNav';
import {
  PilatesDashboardView,
  BookingCalendarView,
  ServiceManagementView,
  MemberListView,
  InstructorListView,
} from './index';
import {
  FinanceOverviewView,
  ExpenseManagementView,
  IncomeManagementView,
} from '@/core/finance';
import { AttendanceManagementView } from '@/core/attendance';
import { noticesViewEntry } from '@/core/notices';
import { OwnerGuideOverlays, OwnerGuideView } from '@/core/onboarding';
import { AcademySettingsView } from '@/modules/piano/components/settings/AcademySettingsView';

const PILATES_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <PilatesDashboardView />,
  bookings: () => <BookingCalendarView />,
  services: () => <ServiceManagementView />,
  members: () => <MemberListView />,
  instructors: () => <InstructorListView />,
  attendance: () => <AttendanceManagementView />,
  ...noticesViewEntry,
  finance: () => <FinanceOverviewView />,
  income: () => <IncomeManagementView />,
  expenses: () => <ExpenseManagementView />,
  guide: () => <OwnerGuideView />,
  settings: () => <AcademySettingsView />,
};

export const PilatesAppContent: FC = () => {
  const { activeTab } = useApp();
  const { isOwner } = usePermissions();

  useTabGuard();

  const renderView = PILATES_VIEW_MAP[activeTab] ?? PILATES_VIEW_MAP.dashboard;

  return (
    <ModuleAppShell
      theme="teal"
      beforeHeader={isSupabaseConfigured() ? <SupabaseRoleSync /> : null}
      sidebar={<PilatesSidebar />}
      bottomNav={<PilatesBottomNav />}
      overlays={
        <>
          {isOwner && <DirectorFloatingFab />}
          <PwaInstallPrompt />
          <OwnerGuideOverlays />
          <ConfirmDialog />
          <ToastContainer />
        </>
      }
    >
      {renderView()}
    </ModuleAppShell>
  );
};
