import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { SupabaseRoleSync } from './SupabaseRoleSync';
import { isSupabaseConfigured } from './lib/supabase';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { DirectorFloatingFab } from './components/common/DirectorFloatingFab';
import { ToastContainer } from './components/common/Toast';
import { ConfirmDialog } from './components/common/ConfirmDialog';

import { DashboardView } from './components/dashboard/DashboardView';
import { StudentListView } from './components/students/StudentListView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { WeeklyTimetableView } from './components/timetable/WeeklyTimetableView';
import { TuitionManagementView } from './components/tuition/TuitionManagementView';
import { TextbookManagementView } from './components/textbooks/TextbookManagementView';
import { ExpenseManagementView } from './components/expenses/ExpenseManagementView';
import { ClassManagementView } from './components/classes/ClassManagementView';
import { ParentManagementView } from './components/parents/ParentManagementView';
import { LessonRecordsView } from './components/lessons/LessonRecordsView';
import { PracticeRecordsView } from './components/practice/PracticeRecordsView';
import { ConsultationRecordsView } from './components/consultations/ConsultationRecordsView';
import { ResourceManagementView } from './components/resources/ResourceManagementView';
import { TeacherManagementView } from './components/teachers/TeacherManagementView';
import { AcademyCalendarView } from './components/calendar/AcademyCalendarView';
import { NotificationManagementView } from './components/notifications/NotificationManagementView';
import { AcademySettingsView } from './components/settings/AcademySettingsView';
import { StudentDetailModal } from './components/students/StudentDetailModal';

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
