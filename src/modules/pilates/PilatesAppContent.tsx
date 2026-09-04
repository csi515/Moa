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
  PassManagementView,
} from './index';
import {
  accountViewEntry,
  attendanceViewEntry,
  financeViewEntries,
} from '@/core/industry/commonViewEntries';
import { noticesViewEntry } from '@/core/notices';
import { AcademySettingsView } from '@/core/academy';

const PILATES_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <PilatesDashboardView />,
  bookings: () => <BookingCalendarView />,
  services: () => <ServiceManagementView />,
  members: () => <MemberListView />,
  passes: () => <PassManagementView />,
  instructors: () => <InstructorListView />,
  ...attendanceViewEntry,
  ...noticesViewEntry,
  ...financeViewEntries,
  settings: () => <AcademySettingsView />,
  ...accountViewEntry,
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
          <ConfirmDialog />
          <ToastContainer />
        </>
      }
    >
      {renderView()}
    </ModuleAppShell>
  );
};
