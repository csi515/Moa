import React from 'react';
import { useAuth } from './core/auth/AuthProvider';
import { AuthPage } from './core/auth/AuthPage';
import { PostSignupGate } from './core/auth/PostSignupGate';
import { needsAccountTypeOnboarding } from './core/auth/utils/accountTypeOnboarding';
import { useOrganization } from './core/organizations/OrganizationProvider';
import { OrganizationSelector } from './core/organizations/OrganizationSelector';
import { IndustryAppRouter } from './core/industry/IndustryAppRouter';
import { ParentShell } from './modules/parent/ParentShell';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { StorageHydrator } from './StorageHydrator';

export const SupabaseAppGate: React.FC = () => {
  const { session, user, loading: authLoading } = useAuth();
  const {
    currentOrganization,
    organizations,
    portalChildCount,
    loading: orgLoading,
    isParentOnly,
    parentPortalActive,
  } = useOrganization();

  const showAccountTypeOnboarding =
    !!session &&
    !authLoading &&
    needsAccountTypeOnboarding({
      user,
      organizations,
      portalChildCount,
      orgLoading,
    });

  if (authLoading || (session && orgLoading && !showAccountTypeOnboarding)) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  if (showAccountTypeOnboarding) {
    return <PostSignupGate />;
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
