import React from 'react';
import { ModuleViewRouter } from '@/shared/components/layout/ModuleViewRouter';
import { IndustryModuleSidebar } from '@/shared/components/layout/IndustryModuleSidebar';
import { IndustryModuleBottomNav } from '@/shared/components/layout/IndustryModuleBottomNav';
import {
  SkincareDashboardView,
  TreatmentMenuView,
  CareProgramManagementView,
  CustomerListView,
  TherapistListView,
  useModuleLabels,
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
import { buildSkincareNavSections, buildSkincareBottomNavTabs } from './config/nav';

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

export const SkincareAppContent: React.FC = () => (
  <ModuleViewRouter
    views={SKINCARE_VIEWS}
    fallback={SkincareDashboardView}
    theme="rose"
    sidebar={
      <IndustryModuleSidebar
        buildSections={buildSkincareNavSections}
        useLabels={useModuleLabels}
        theme="rose"
      />
    }
    bottomNav={
      <IndustryModuleBottomNav
        buildTabs={buildSkincareBottomNavTabs}
        useLabels={useModuleLabels}
        moreMenuSubtitle="스킨케어 샵 메뉴를 선택하세요"
        theme="rose"
      />
    }
  />
);
