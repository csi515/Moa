import { type FC, type ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useTabGuard } from '@/core/auth/useTabGuard';
import {
  DirectorFloatingFab,
  ToastContainer,
  ConfirmDialog,
  OnboardingWizard,
} from '@/shared/components';
import { OnboardingResumeCard } from '@/shared/components/onboarding/OnboardingResumeCard';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
import { PianoSidebar } from './layout/PianoSidebar';
import { PianoBottomNav } from './layout/PianoBottomNav';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  customerHubTabs,
  financeViewEntries,
  hubViewAliases,
  settingsHubTabs,
} from '@/core/industry/commonViewEntries';
import { AttendanceManagementView } from '@/core/attendance';
import { PianoAttendanceView } from './components/attendance/PianoAttendanceView';
import {
  CustomerHubView,
  SettingsHubView,
  ClassManagementView,
} from '@/core/academy';
import {
  DashboardView,
  RecitalManagementView,
  TextbookManagementView,
  PracticeRecordsView,
  ResourceManagementView,
  CurriculumManagementView,
  AssignmentsManagementView,
  AchievementsManagementView,
  ReportsManagementView,
} from './index';
import { PassManagementView } from '@/modules/pilates/components/passes/PassManagementView';
import { PianoScheduleView } from './components/schedule';
import { PianoConsultationHubView } from './components/consultations';
import { SongProgressStaffView } from './components/songProgress';
import { PIANO_SETTINGS_EXTRAS } from './config/nav';
import { usePianoOnboardingUi } from './hooks/usePianoOnboardingUi';

const pianoSettingsHub = () => (
  <SettingsHubView extras={PIANO_SETTINGS_EXTRAS} workplaceLabel="학원" staffLabel="강사" />
);

const customerHub = () => <CustomerHubView enrollmentLabel="등록" />;
const scheduleHub = () => <PianoScheduleView />;
const attendanceHub = () => <PianoAttendanceView />;

/**
 * 탭 → 화면. 허브 딥링크는 hubViewAliases로 묶고,
 * lessons는 레거시 호환용으로 출결에 연결 (기능 삭제 없음).
 */
const PIANO_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <DashboardView />,
  ...hubViewAliases(customerHub, customerHubTabs),
  ...hubViewAliases(attendanceHub, ['attendance', 'lessons']),
  'check-in': () => <AttendanceManagementView />,
  ...hubViewAliases(scheduleHub, ['timetable', 'calendar', 'makeups', 'practice-rooms']),
  ...financeViewEntries,
  classes: () => <ClassManagementView />,
  consultations: () => <PianoConsultationHubView />,
  practice: () => <PracticeRecordsView />,
  resources: () => <ResourceManagementView />,
  textbooks: () => <TextbookManagementView />,
  passes: () => <PassManagementView variant="piano" />,
  recitals: () => <RecitalManagementView />,
  curriculum: () => <CurriculumManagementView />,
  assignments: () => <AssignmentsManagementView />,
  achievements: () => <AchievementsManagementView />,
  'song-stamps': () => <SongProgressStaffView />,
  reports: () => <ReportsManagementView />,
  ...hubViewAliases(pianoSettingsHub, settingsHubTabs),
};

export const PianoAppContent: FC = () => {
  const { activeTab } = useApp();
  const { isOwner } = usePermissions();
  const {
    showOnboarding,
    showResumeCard,
    resumeStepLabel,
    handleOnboardingComplete,
    handleResumeContinue,
    handleResumeSkip,
  } = usePianoOnboardingUi();

  useTabGuard();

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
          {showOnboarding && <OnboardingWizard onComplete={handleOnboardingComplete} />}
          <ConfirmDialog />
          <ToastContainer />
        </>
      }
    >
      {showResumeCard && activeTab === 'dashboard' && (
        <div className="px-4 pt-3 max-w-3xl mx-auto w-full">
          <OnboardingResumeCard
            stepLabel={resumeStepLabel}
            onContinue={handleResumeContinue}
            onSkip={handleResumeSkip}
          />
        </div>
      )}
      {renderView()}
    </ModuleAppShell>
  );
};
