import React from 'react';
import { useApp } from '@/context/AppContext';
import { useTabGuard } from '@/core/auth/useTabGuard';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
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

const PILATES_VIEWS: Record<string, React.FC> = {
  dashboard: PilatesDashboardView,
  bookings: BookingCalendarView,
  services: ServiceManagementView,
  products: ProductManagementView,
  members: MemberListView,
  instructors: InstructorListView,
  finance: FinanceOverviewView,
  income: IncomeManagementView,
  expenses: ExpenseManagementView,
  settings: AcademySettingsView,
};

export const PilatesAppContent: React.FC = () => {
  const { activeTab } = useApp();
  useTabGuard();

  const View = PILATES_VIEWS[activeTab] ?? PilatesDashboardView;

  return (
    <ModuleAppShell theme="teal" sidebar={<PilatesSidebar />} bottomNav={<PilatesBottomNav />}>
      <View />
    </ModuleAppShell>
  );
};
