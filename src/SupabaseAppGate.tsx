import React from 'react';
import { useAuth } from './core/auth/AuthProvider';
import { AuthPage } from './core/auth/AuthPage';
import { useOrganization } from './core/organizations/OrganizationProvider';
import { OrganizationSelector } from './core/organizations/OrganizationSelector';
import { IndustryAppRouter } from './core/industry/IndustryAppRouter';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { StorageHydrator } from './StorageHydrator';
import { isKioskRoute } from './core/attendance/kiosk/kioskConfig';
import { AttendanceKioskPage } from './core/attendance/kiosk/AttendanceKioskPage';

export const SupabaseAppGate: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const kioskMode = isKioskRoute();

  if (authLoading || (session && orgLoading)) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  if (!currentOrganization) {
    return <OrganizationSelector />;
  }

  return (
    <StorageHydrator
      organizationId={currentOrganization.id}
      industryType={currentOrganization.industry_type}
    >
      {kioskMode ? <AttendanceKioskPage /> : <IndustryAppRouter />}
    </StorageHydrator>
  );
};
