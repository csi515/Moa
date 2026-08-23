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
import { AcademySidebar } from './layout/AcademySidebar';
import { AcademyBottomNav } from './layout/AcademyBottomNav';
import { AcademyDashboardView } from './components/dashboard/AcademyDashboardView';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { StorageService } from '@/services/storage';
import {
  ExpenseManagementView,
  FinanceOverviewView,
  IncomeManagementView,
} from '@/core/finance';
import { AttendanceManagementView } from '@/core/attendance';
import { ProductManagementView } from '@/core/products';
import {
  StudentListView,
  WeeklyTimetableView,
  TuitionManagementView,
  UnpaidManagementView,
  MakeupManagementView,
  ClassManagementView,
  ParentManagementView,
  ConsultationRecordsView,
  TeacherManagementView,
  AcademyCalendarView,
  AcademySettingsView,
} from '@/modules/piano';

/** 일반 학원(국영수 등) 앱 셸 — 원생 등록·퇴원, 반 요일·시간·수업 길이 */
export const AcademyAppContent: React.FC = () => {
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
        return <AcademyDashboardView />;
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
      case 'products':
        return <ProductManagementView />;
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
      case 'consultations':
        return <ConsultationRecordsView />;
      case 'teachers':
        return <TeacherManagementView />;
      case 'calendar':
        return <AcademyCalendarView />;
      case 'settings':
        return <AcademySettingsView />;
      default:
        return <AcademyDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {isSupabaseConfigured() && <SupabaseRoleSync />}
      <Header />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <AcademySidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      <AcademyBottomNav />
      {isOwner && <DirectorFloatingFab />}
      <PwaInstallPrompt />
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};
