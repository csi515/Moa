import React from 'react';
import { useApp } from '@/context/AppContext';
import {
  Header,
  Sidebar,
  BottomNav,
  PwaInstallPrompt,
  DirectorFloatingFab,
  ToastContainer,
  ConfirmDialog,
} from '@/shared/components';
import { SupabaseRoleSync } from './SupabaseRoleSync';
import { isSupabaseConfigured } from './lib/supabase';
import {
  DashboardView,
  StudentListView,
  StudentDetailModal,
  AttendanceView,
  WeeklyTimetableView,
  TuitionManagementView,
  TextbookManagementView,
  ExpenseManagementView,
  ClassManagementView,
  ParentManagementView,
  LessonRecordsView,
  PracticeRecordsView,
  ConsultationRecordsView,
  ResourceManagementView,
  TeacherManagementView,
  AcademyCalendarView,
  NotificationManagementView,
  AcademySettingsView,
} from './modules/piano';

export const AppContent: React.FC = () => {
  const { activeTab, selectedStudentId, setSelectedStudentId } = useApp();

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'students':
        return <StudentListView />;
      case 'attendance':
        return <AttendanceView />;
      case 'timetable':
        return <WeeklyTimetableView />;
      case 'tuition':
        return <TuitionManagementView />;
      case 'textbooks':
        return <TextbookManagementView />;
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
      case 'resources':
        return <ResourceManagementView />;
      case 'teachers':
        return <TeacherManagementView />;
      case 'calendar':
        return <AcademyCalendarView />;
      case 'notifications':
        return <NotificationManagementView />;
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
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {renderActiveView()}
        </main>
      </div>

      <BottomNav />
      <DirectorFloatingFab />

      {selectedStudentId && (
        <StudentDetailModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}

      <PwaInstallPrompt />
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};
