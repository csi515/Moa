import React from 'react';
import { AppProvider } from './context/AppContext';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { SupabaseRequiredScreen } from './shared/components/SupabaseRequiredScreen';
import { isSupabaseConfigured } from './lib/supabase';
import { MobileBootstrap } from './core/platform';

export default function App() {
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
