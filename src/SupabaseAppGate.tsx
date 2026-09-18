import React, { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './core/auth/AuthProvider';
import { AuthPage } from './core/auth/AuthPage';
import { useOrganization } from './core/organizations/OrganizationProvider';
import { OrganizationSelector } from './core/organizations/OrganizationSelector';
import { OwnerOperationStoppedView } from './core/organizations/OwnerOperationStoppedView';
import { IndustryAppRouter } from './core/industry/IndustryAppRouter';
import { ParentShell } from './modules/parent/ParentShell';
import { CustomerShell } from './core/customer/CustomerShell';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { PwaInstallPrompt } from './shared/components/PwaInstallPrompt';
import { StorageHydrator } from './StorageHydrator';

export const SupabaseAppGate: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const {
    currentOrganization,
    currentRole,
    blockedOwnerOrgIds,
    loading: orgLoading,
    isParentOnly,
    isCustomerOnly,
    parentPortalActive,
    customerPortalActive,
    enterParentPortal,
    enterCustomerPortal,
  } = useOrganization();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const st = location.state as {
      openParentPortal?: boolean;
      openCustomerPortal?: boolean;
    } | null;
    if (!session || !st) return;
    if (st.openParentPortal) {
      enterParentPortal();
      navigate(location.pathname, { replace: true, state: {} });
      return;
    }
    if (st.openCustomerPortal) {
      enterCustomerPortal();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [
    session,
    location.state,
    location.pathname,
    enterParentPortal,
    enterCustomerPortal,
    navigate,
  ]);

  if (authLoading || (session && orgLoading)) {
    return <LoadingScreen />;
  }

  let content: ReactNode;

  if (!session) {
    content = <AuthPage />;
  } else if (isParentOnly || parentPortalActive) {
    content = <ParentShell />;
  } else if (isCustomerOnly || customerPortalActive) {
    content = <CustomerShell />;
  } else if (
    currentOrganization &&
    currentRole === 'owner' &&
    blockedOwnerOrgIds.includes(currentOrganization.id)
  ) {
    content = <OwnerOperationStoppedView />;
  } else if (!currentOrganization) {
    content = <OrganizationSelector />;
  } else {
    content = (
      <StorageHydrator
        organizationId={currentOrganization.id}
        industryType={currentOrganization.industry_type}
      >
        <IndustryAppRouter />
      </StorageHydrator>
    );
  }

  return (
    <>
      {content}
      <PwaInstallPrompt />
    </>
  );
};
