import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './core/auth/AuthProvider';
import { AuthPage } from './core/auth/AuthPage';
import { useOrganization } from './core/organizations/OrganizationProvider';
import { OrganizationSelector } from './core/organizations/OrganizationSelector';
import { IndustryAppRouter } from './core/industry/IndustryAppRouter';
import { ParentShell } from './modules/parent/ParentShell';
import { CustomerShell } from './core/customer/CustomerShell';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { StorageHydrator } from './StorageHydrator';

export const SupabaseAppGate: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const {
    currentOrganization,
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

  if (!session) {
    return <AuthPage />;
  }

  if (isParentOnly || parentPortalActive) {
    return <ParentShell />;
  }

  if (isCustomerOnly || customerPortalActive) {
    return <CustomerShell />;
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
