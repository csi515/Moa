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
import { OnboardingResumeCard } from '@/shared/components/onboarding/OnboardingResumeCard';
import { ONBOARDING_STEP_LABELS } from '@/shared/components/onboarding/onboardingHelpers';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
import { PianoSidebar } from './layout/PianoSidebar';
import { PianoBottomNav } from './layout/PianoBottomNav';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { StorageService } from '@/services/storage';
import { financeViewEntries } from '@/core/industry/commonViewEntries';
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

const PIANO_SETTINGS_EXTRAS: { tab: NavTab; label: string }[] = [
  { tab: 'classes', label: '정규 레슨' },
  { tab: 'check-in', label: 'PIN 출석' },
  { tab: 'assignments', label: '주간 과제' },
  { tab: 'practice', label: '연습 기록' },
  { tab: 'practice-rooms', label: '연습실 예약' },
  { tab: 'textbooks', label: '교재 관리' },
  { tab: 'passes', label: '회차권 관리' },
  // 교재·곡 자료(resources): 당분간 UI 숨김 — VIEW_MAP·ResourceManagementView 유지
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
  /** 등원 출결 (레슨과 분리) */
  attendance: () => <PianoAttendanceView />,
  /** 오늘 레슨·레슨 일지 — 일정 허브 */
  lessons: () => <PianoScheduleView />,
  'check-in': () => <AttendanceManagementView />,
  timetable: () => <PianoScheduleView />,
  calendar: () => <PianoScheduleView />,
  makeups: () => <PianoScheduleView />,
  'practice-rooms': () => <PianoScheduleView />,
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
  reports: () => <ReportsManagementView />,
  settings: pianoSettingsHub,
  teachers: pianoSettingsHub,
  notices: pianoSettingsHub,
  account: pianoSettingsHub,
};

export const PianoAppContent: FC = () => {
  const { activeTab, openConfirmDialog, showToast } = useApp();
  const { isAdmin, isOwner } = usePermissions();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showResumeCard, setShowResumeCard] = useState(false);
  const [resumeStepLabel, setResumeStepLabel] = useState<string | undefined>();

  useTabGuard();

  const refreshOnboardingUi = () => {
    if (!isAdmin) {
      setShowOnboarding(false);
      setShowResumeCard(false);
      return;
    }
    const autoOpen = StorageService.shouldAutoOpenOnboarding();
    const resume = StorageService.shouldShowOnboardingResume();
    setShowOnboarding(autoOpen);
    setShowResumeCard(resume);
    if (resume) {
      const step = StorageService.getOnboardingProgress().step;
      setResumeStepLabel(ONBOARDING_STEP_LABELS[step] ?? undefined);
    }
  };

  useEffect(() => {
    refreshOnboardingUi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refreshOnboardingUi();
  };

  const handleResumeContinue = () => {
    setShowResumeCard(false);
    setShowOnboarding(true);
  };

  const handleResumeSkip = () => {
    openConfirmDialog({
      title: '초기 설정을 건너뛸까요?',
      message:
        '나중에 설정 메뉴에서 학원 정보·수납·출결·상담을 변경할 수 있습니다. 앱은 바로 사용할 수 있습니다.',
      confirmText: '건너뛰기',
      cancelText: '취소',
      onConfirm: () => {
        StorageService.markOnboardingSkipped();
        setShowResumeCard(false);
        setShowOnboarding(false);
        showToast('초기 설정을 건너뛰었습니다.', 'info');
      },
    });
  };

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
