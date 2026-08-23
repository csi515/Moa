import React from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useTabGuard } from '@/core/auth/useTabGuard';
import {
  Header,
  PwaInstallPrompt,
  DirectorFloatingFab,
  ToastContainer,
  ConfirmDialog,
} from '@/shared/components';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { SkincareSidebar } from './layout/SkincareSidebar';
import { SkincareBottomNav } from './layout/SkincareBottomNav';
import {
  SkincareDashboardView,
  TreatmentMenuView,
  CareProgramManagementView,
  CustomerListView,
  TherapistListView,
} from './index';
import { BookingCalendarView } from '@/modules/pilates/components/bookings/BookingCalendarView';
import { ConsultationRecordsView } from '@/modules/piano/components/consultations/ConsultationRecordsView';
import {
  FinanceOverviewView,
  ExpenseManagementView,
  IncomeManagementView,
} from '@/core/finance';
import { AcademySettingsView } from '@/modules/piano/components/settings/AcademySettingsView';

export const SkincareAppContent: React.FC = () => {
  const { activeTab } = useApp();
  const { isOwner } = usePermissions();

  useTabGuard();

  const renderView = () => {
    switch (activeTab) {
      case 'bookings':
        return <BookingCalendarView />;
      case 'services':
        return <TreatmentMenuView />;
      case 'care-programs':
        return <CareProgramManagementView />;
      case 'members':
        return <CustomerListView />;
      case 'consultations':
        return <ConsultationRecordsView />;
      case 'instructors':
        return <TherapistListView />;
      case 'finance':
        return <FinanceOverviewView />;
      case 'income':
        return <IncomeManagementView />;
      case 'expenses':
        return <ExpenseManagementView />;
      case 'settings':
        return <AcademySettingsView />;
      case 'dashboard':
      default:
        return <SkincareDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F4] text-slate-800 flex flex-col font-sans antialiased selection:bg-rose-500 selection:text-white">
      {isSupabaseConfigured() && <SupabaseRoleSync />}
      <Header />
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <SkincareSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">{renderView()}</main>
      </div>
      <SkincareBottomNav />
      {isOwner && <DirectorFloatingFab />}
      <PwaInstallPrompt />
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};
