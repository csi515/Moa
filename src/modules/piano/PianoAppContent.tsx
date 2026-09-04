import { useState, useEffect, type FC, type ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useTabGuard } from '@/core/auth/useTabGuard';
import {
  PwaInstallPrompt,
  DirectorFloatingFab,
  ToastContainer,
  ConfirmDialog,
  OnboardingWizard,
} from '@/shared/components';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
import { PianoSidebar } from './layout/PianoSidebar';
import { PianoBottomNav } from './layout/PianoBottomNav';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { StorageService } from '@/services/storage';
import {
  accountViewEntry,
  attendanceViewEntry,
  financeViewEntries,
} from '@/core/industry/commonViewEntries';
import { noticesViewEntry } from '@/core/notices';
import {
  DashboardView,
  StudentListView,
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
  AcademySettingsView,
  CurriculumManagementView,
  AssignmentsManagementView,
  AchievementsManagementView,
  ReportsManagementView,
} from './index';
import { PianoScheduleView } from './components/schedule';
import { GuardianEnrollmentRequestsView } from '@/core/academy';

const PIANO_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <DashboardView />,
  students: () => <StudentListView />,
  ...attendanceViewEntry,
  timetable: () => <PianoScheduleView />,
  tuition: () => <TuitionManagementView />,
  unpaid: () => <UnpaidManagementView />,
  makeups: () => <MakeupManagementView />,
  textbooks: () => <TextbookManagementView />,
  ...financeViewEntries,
  classes: () => <ClassManagementView />,
  parents: () => <ParentManagementView />,
  'enrollment-requests': () => <GuardianEnrollmentRequestsView />,
  lessons: () => <LessonRecordsView />,
  practice: () => <PracticeRecordsView />,
  consultations: () => <ConsultationRecordsView />,
  ...noticesViewEntry,
  resources: () => <ResourceManagementView />,
  teachers: () => <TeacherManagementView />,
  calendar: () => <PianoScheduleView />,
  recitals: () => <RecitalManagementView />,
  curriculum: () => <CurriculumManagementView />,
  assignments: () => <AssignmentsManagementView />,
  achievements: () => <AchievementsManagementView />,
  reports: () => <ReportsManagementView />,
  settings: () => <AcademySettingsView />,
  ...accountViewEntry,
};

export const PianoAppContent: FC = () => {
  const { activeTab } = useApp();
  const { isAdmin, isOwner } = usePermissions();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useTabGuard();

  useEffect(() => {
    if (isAdmin) {
      setShowOnboarding(StorageService.shouldShowOnboarding());
    }
  }, [isAdmin]);

  const renderView = PIANO_VIEW_MAP[activeTab] ?? PIANO_VIEW_MAP.dashboard;

  return (
    <ModuleAppShell
      theme="indigo"
      beforeHeader={isSupabaseConfigured() ? <SupabaseRoleSync /> : null}
      sidebar={<PianoSidebar />}
      bottomNav={<PianoBottomNav />}
      overlays={
        <>
          {isOwner && <DirectorFloatingFab />}
          <PwaInstallPrompt />
          {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
          <ConfirmDialog />
          <ToastContainer />
        </>
      }
    >
      {renderView()}
    </ModuleAppShell>
  );
};
