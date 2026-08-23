import React from 'react';
import { useApp } from '@/context/AppContext';
import { useTabGuard } from '@/core/auth/useTabGuard';
import { ModuleAppShell } from '@/shared/components/layout/ModuleAppShell';
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
import { ProductManagementView } from '@/core/products';
import { AcademySettingsView } from '@/modules/piano/components/settings/AcademySettingsView';

const SKINCARE_VIEWS: Record<string, React.FC> = {
  dashboard: SkincareDashboardView,
  bookings: BookingCalendarView,
  services: TreatmentMenuView,
  'care-programs': CareProgramManagementView,
  products: ProductManagementView,
  members: CustomerListView,
  consultations: ConsultationRecordsView,
  instructors: TherapistListView,
  finance: FinanceOverviewView,
  income: IncomeManagementView,
  expenses: ExpenseManagementView,
  settings: AcademySettingsView,
};

export const SkincareAppContent: React.FC = () => {
  const { activeTab } = useApp();
  useTabGuard();

  const View = SKINCARE_VIEWS[activeTab] ?? SkincareDashboardView;

  return (
    <ModuleAppShell theme="rose" sidebar={<SkincareSidebar />} bottomNav={<SkincareBottomNav />}>
      <View />
    </ModuleAppShell>
  );
};
