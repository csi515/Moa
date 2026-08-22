import React from 'react';
import { AppProvider } from './context/AppContext';
import { AppContent } from './AppContent';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  if (!isSupabaseConfigured()) {
    return (
      <AppProvider>
        <AppContent />
      </AppProvider>
    );
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
