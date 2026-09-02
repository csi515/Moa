import React, { useEffect } from 'react';
import { useAuth } from './core/auth/AuthProvider';
import { AuthPage } from './core/auth/AuthPage';
import { parseGuardianLinkFromUrl, storePendingGuardianLink } from './core/parent/services/guardianLinkService';
import { parseStaffLinkFromUrl, storePendingStaffLink } from './core/platform/pendingStaffLink';
import { useOrganization } from './core/organizations/OrganizationProvider';
import { OrganizationSelector } from './core/organizations/OrganizationSelector';
import { IndustryAppRouter } from './core/industry/IndustryAppRouter';
import { ParentShell } from './modules/parent/ParentShell';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { StorageHydrator } from './StorageHydrator';

export const SupabaseAppGate: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading, isParentOnly, parentPortalActive } =
    useOrganization();

  useEffect(() => {
    const urlToken = parseGuardianLinkFromUrl();
    if (urlToken) storePendingGuardianLink(urlToken);

    const staffLink = parseStaffLinkFromUrl();
    if (staffLink) storePendingStaffLink(staffLink);
  }, []);

  if (authLoading || (session && orgLoading)) {
    return <LoadingScreen />;
  }

  if (!session) {
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
