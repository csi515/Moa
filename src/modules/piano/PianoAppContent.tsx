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
  ExpenseManagementView,
  FinanceOverviewView,
  IncomeManagementView,
} from '@/core/finance';
import { AttendanceManagementView } from '@/core/attendance';
import { ParentNoticeView } from '@/core/notices';
import {
  DashboardView,
  StudentListView,
  WeeklyTimetableView,
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
  AcademyCalendarView,
  AcademySettingsView,
  CurriculumManagementView,
  AssignmentsManagementView,
  AchievementsManagementView,
  ReportsManagementView,
} from './index';

const PIANO_VIEW_MAP: Record<string, () => ReactNode> = {
  dashboard: () => <DashboardView />,
  students: () => <StudentListView />,
  attendance: () => <AttendanceManagementView />,
  timetable: () => <WeeklyTimetableView />,
  tuition: () => <TuitionManagementView />,
  unpaid: () => <UnpaidManagementView />,
  makeups: () => <MakeupManagementView />,
  textbooks: () => <TextbookManagementView />,
  finance: () => <FinanceOverviewView />,
  income: () => <IncomeManagementView />,
  expenses: () => <ExpenseManagementView />,
  classes: () => <ClassManagementView />,
  parents: () => <ParentManagementView />,
  lessons: () => <LessonRecordsView />,
  practice: () => <PracticeRecordsView />,
  consultations: () => <ConsultationRecordsView />,
  notices: () => <ParentNoticeView />,
  resources: () => <ResourceManagementView />,
  teachers: () => <TeacherManagementView />,
  calendar: () => <AcademyCalendarView />,
  recitals: () => <RecitalManagementView />,
  curriculum: () => <CurriculumManagementView />,
  assignments: () => <AssignmentsManagementView />,
  achievements: () => <AchievementsManagementView />,
  reports: () => <ReportsManagementView />,
  settings: () => <AcademySettingsView />,
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
