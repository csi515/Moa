import React from 'react';
import { AppProvider } from './context/AppContext';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { SupabaseRequiredScreen } from './shared/components/SupabaseRequiredScreen';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  if (!isSupabaseConfigured()) {
    return <SupabaseRequiredScreen />;
  }

  return (
    <AuthProvider>
      <OrganizationProvider>
        <AppProvider>
          <SupabaseAppGate />
        </AppProvider>
      </OrganizationProvider>
    </AuthProvider>
  );
}
