import { useState, useEffect, type FC, type ReactNode } from 'react';
import { useApp, type NavTab } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useTabGuard } from '@/core/auth/useTabGuard';
import {
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
import { financeViewEntries } from '@/core/industry/commonViewEntries';
import { AttendanceManagementView } from '@/core/attendance';
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
import { PianoScheduleView } from './components/schedule';
import { PianoConsultationHubView } from './components/consultations';

const PIANO_SETTINGS_EXTRAS: { tab: NavTab; label: string }[] = [
  { tab: 'classes', label: '정규 레슨' },
      { tab: 'check-in', label: 'PIN 출석' },
  { tab: 'assignments', label: '주간 과제' },
  { tab: 'practice', label: '연습 기록' },
  { tab: 'textbooks', label: '교재 판매' },
  { tab: 'resources', label: '교재·곡 자료' },
  { tab: 'recitals', label: '연주회·콩쿠르' },
  { tab: 'curriculum', label: '커리큘럼·진도' },
  { tab: 'achievements', label: '시험·등급' },
  { tab: 'reports', label: '학습 리포트' },
];

const pianoSettingsHub = () => (
  <SettingsHubView extras={PIANO_SETTINGS_EXTRAS} workplaceLabel="학원" staffLabel="강사" />
);

const customerHub = () => <CustomerHubView enrollmentLabel="등록 요청" />;

const PIANO_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <DashboardView />,
  students: customerHub,
  parents: customerHub,
  'enrollment-requests': customerHub,
  /** 레슨 출결 정본 — PIN 출석과 분리 */
  attendance: () => <PianoScheduleView />,
  lessons: () => <PianoScheduleView />,
  'check-in': () => <AttendanceManagementView />,
  timetable: () => <PianoScheduleView />,
  calendar: () => <PianoScheduleView />,
  makeups: () => <PianoScheduleView />,
  ...financeViewEntries,
  classes: () => <ClassManagementView />,
  consultations: () => <PianoConsultationHubView />,
  practice: () => <PracticeRecordsView />,
  resources: () => <ResourceManagementView />,
  textbooks: () => <TextbookManagementView />,
  recitals: () => <RecitalManagementView />,
  curriculum: () => <CurriculumManagementView />,
  assignments: () => <AssignmentsManagementView />,
  achievements: () => <AchievementsManagementView />,
  reports: () => <ReportsManagementView />,
  settings: pianoSettingsHub,
  teachers: pianoSettingsHub,
  notices: pianoSettingsHub,
  account: pianoSettingsHub,
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
