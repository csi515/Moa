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
import { PilatesSidebar } from './layout/PilatesSidebar';
import { PilatesBottomNav } from './layout/PilatesBottomNav';
import {
  PilatesDashboardView,
  BookingCalendarView,
  ServiceManagementView,
  MemberListView,
  InstructorListView,
} from './index';
import {
  FinanceOverviewView,
  ExpenseManagementView,
  IncomeManagementView,
} from '@/core/finance';
import { ProductManagementView } from '@/core/products';
import { AcademySettingsView } from '@/modules/piano/components/settings/AcademySettingsView';

export const PilatesAppContent: React.FC = () => {
  const { activeTab } = useApp();
  const { isOwner } = usePermissions();

  useTabGuard();

  const renderView = () => {
    switch (activeTab) {
      case 'bookings':
        return <BookingCalendarView />;
      case 'services':
        return <ServiceManagementView />;
      case 'products':
        return <ProductManagementView />;
      case 'members':
        return <MemberListView />;
      case 'instructors':
        return <InstructorListView />;
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
        return <PilatesDashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-white">
      {isSupabaseConfigured() && <SupabaseRoleSync />}
      <Header />
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <PilatesSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">{renderView()}</main>
      </div>
      <PilatesBottomNav />
      {isOwner && <DirectorFloatingFab />}
      <PwaInstallPrompt />
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};
