import React from 'react';
import { AppProvider } from './context/AppContext';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { SupabaseRequiredScreen } from './shared/components/SupabaseRequiredScreen';
import { isSupabaseConfigured } from './lib/supabase';
import { MobileBootstrap } from './core/platform';
import { getPublicLegalPage, LegalPageView } from './core/legal';

export default function App() {
  const legalPage = getPublicLegalPage();
  if (legalPage) {
    return <LegalPageView page={legalPage} />;
  }

  if (!isSupabaseConfigured()) {
    return <SupabaseRequiredScreen />;
  }

  return (
    <AuthProvider>
      <OrganizationProvider>
        <AppProvider>
          <MobileBootstrap />
          <SupabaseAppGate />
        </AppProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
