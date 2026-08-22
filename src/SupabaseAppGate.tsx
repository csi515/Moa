import React from 'react';
import { useAuth } from './core/auth/AuthProvider';
import { AuthPage } from './core/auth/AuthPage';
import { useOrganization } from './core/organizations/OrganizationProvider';
import { OrganizationSelector } from './core/organizations/OrganizationSelector';
import { LoadingScreen } from './shared/components/LoadingScreen';
import { AppContent } from './AppContent';

export const SupabaseAppGate: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();

  if (authLoading || (session && orgLoading)) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <AuthPage />;
  }

  if (!currentOrganization) {
    return <OrganizationSelector />;
  }

  return <AppContent />;
};
