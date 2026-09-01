import React from 'react';
import { useAuth } from './core/auth/AuthProvider';
import { AuthPage } from './core/auth/AuthPage';
import { useOrganization } from './core/organizations/OrganizationProvider';
import { OrganizationSelector } from './core/organizations/OrganizationSelector';
import { IndustryAppRouter } from './core/industry/IndustryAppRouter';
import { ParentShell } from './modules/parent/ParentShell';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { StorageHydrator } from './StorageHydrator';

export const SupabaseAppGate: React.FC = () => {
  const { session, loading: authLoading, passwordRecoveryPending } = useAuth();
  const { currentOrganization, loading: orgLoading, isParentOnly, parentPortalActive } =
    useOrganization();

  if (authLoading || (session && orgLoading && !passwordRecoveryPending)) {
    return <LoadingScreen />;
  }

  if (!session || passwordRecoveryPending) {
    return <AuthPage />;
  }

  if (isParentOnly || parentPortalActive) {
    return <ParentShell />;
  }

  if (!currentOrganization) {
    return <OrganizationSelector />;
  }

  return (
    <StorageHydrator
      organizationId={currentOrganization.id}
      industryType={currentOrganization.industry_type}
    >
      <IndustryAppRouter />
    </StorageHydrator>
  );
};
