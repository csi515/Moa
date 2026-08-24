import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useTabGuard } from '@/core/auth/useTabGuard';
import {
  Header,
  PwaInstallPrompt,
  DirectorFloatingFab,
  ToastContainer,
  ConfirmDialog,
  OnboardingWizard,
} from '@/shared/components';
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
import { ConsultationBookingAdminView } from '@/core/consultations';
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

export const PianoAppContent: React.FC = () => {
  const { activeTab } = useApp();
  const { isAdmin, isOwner } = usePermissions();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useTabGuard();

  useEffect(() => {
    if (isAdmin) {
      setShowOnboarding(StorageService.shouldShowOnboarding());
    }
  }, [isAdmin]);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'students':
        return <StudentListView />;
      case 'attendance':
        return <AttendanceManagementView />;
      case 'timetable':
        return <WeeklyTimetableView />;
      case 'tuition':
        return <TuitionManagementView />;
      case 'unpaid':
        return <UnpaidManagementView />;
      case 'makeups':
        return <MakeupManagementView />;
      case 'textbooks':
        return <TextbookManagementView />;
      case 'finance':
        return <FinanceOverviewView />;
      case 'income':
        return <IncomeManagementView />;
      case 'expenses':
        return <ExpenseManagementView />;
      case 'classes':
        return <ClassManagementView />;
      case 'parents':
        return <ParentManagementView />;
      case 'lessons':
        return <LessonRecordsView />;
      case 'practice':
        return <PracticeRecordsView />;
      case 'consultations':
        return <ConsultationRecordsView />;
      case 'consultationBooking':
        return <ConsultationBookingAdminView />;
      case 'resources':
        return <ResourceManagementView />;
      case 'teachers':
        return <TeacherManagementView />;
      case 'calendar':
        return <AcademyCalendarView />;
      case 'recitals':
        return <RecitalManagementView />;
      case 'curriculum':
        return <CurriculumManagementView />;
      case 'assignments':
        return <AssignmentsManagementView />;
      case 'achievements':
        return <AchievementsManagementView />;
      case 'reports':
        return <ReportsManagementView />;
      case 'settings':
        return <AcademySettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {isSupabaseConfigured() && <SupabaseRoleSync />}
      <Header />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <PianoSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      <PianoBottomNav />
      {isOwner && <DirectorFloatingFab />}
      <PwaInstallPrompt />
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};
