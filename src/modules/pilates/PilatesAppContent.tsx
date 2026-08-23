import React from 'react';
import { ModuleViewRouter } from '@/shared/components/layout/ModuleViewRouter';
import { IndustryModuleSidebar } from '@/shared/components/layout/IndustryModuleSidebar';
import { IndustryModuleBottomNav } from '@/shared/components/layout/IndustryModuleBottomNav';
import {
  PilatesDashboardView,
  BookingCalendarView,
  ServiceManagementView,
  MemberListView,
  InstructorListView,
  useModuleLabels,
} from './index';
import {
  FinanceOverviewView,
  ExpenseManagementView,
  IncomeManagementView,
} from '@/core/finance';
import { ProductManagementView } from '@/core/products';
import { AcademySettingsView } from '@/modules/piano/components/settings/AcademySettingsView';
import { buildPilatesNavSections, buildPilatesBottomNavTabs } from './config/nav';

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

export const PilatesAppContent: React.FC = () => (
  <ModuleViewRouter
    views={PILATES_VIEWS}
    fallback={PilatesDashboardView}
    theme="teal"
    sidebar={
      <IndustryModuleSidebar
        buildSections={buildPilatesNavSections}
        useLabels={useModuleLabels}
        theme="teal"
      />
    }
    bottomNav={
      <IndustryModuleBottomNav
        buildTabs={buildPilatesBottomNavTabs}
        useLabels={useModuleLabels}
        moreMenuSubtitle="필라테스 스튜디오 메뉴를 선택하세요"
        theme="teal"
      />
    }
  />
);
