import React from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import { PilatesStaffDashboardView } from './PilatesStaffDashboardView';
import { PilatesAdminDashboardView } from './PilatesAdminDashboardView';

export const PilatesDashboardView: React.FC = () => {
  const { isStaff } = usePermissions();
  return isStaff ? <PilatesStaffDashboardView /> : <PilatesAdminDashboardView />;
};
