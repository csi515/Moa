import React, { useEffect, useState } from 'react';
import { AppProvider } from './context/AppContext';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { SupabaseRequiredScreen } from './shared/components/SupabaseRequiredScreen';
import { isSupabaseConfigured } from './lib/supabase';
import { MobileBootstrap } from './core/platform';
import { getPublicLegalPage, LegalPageView, type LegalPageId } from './core/legal';

export default function App() {
  const [legalPage, setLegalPage] = useState<LegalPageId | null>(() => getPublicLegalPage());

  useEffect(() => {
    const syncLegalPage = () => setLegalPage(getPublicLegalPage());
    window.addEventListener('hashchange', syncLegalPage);
    window.addEventListener('popstate', syncLegalPage);
    return () => {
      window.removeEventListener('hashchange', syncLegalPage);
      window.removeEventListener('popstate', syncLegalPage);
    };
  }, []);

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
