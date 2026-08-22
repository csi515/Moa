import React from 'react';
import { AppProvider } from './context/AppContext';
import { AppContent } from './AppContent';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { ModuleLabelsProvider } from './modules/piano';
import { isSupabaseConfigured } from './lib/supabase';

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ModuleLabelsProvider>
      <AppProvider>{children}</AppProvider>
    </ModuleLabelsProvider>
  );
}

export default function App() {
  if (!isSupabaseConfigured()) {
    return (
      <AppShell>
        <AppContent />
      </AppShell>
    );
  }

  return (
    <AuthProvider>
      <OrganizationProvider>
        <AppShell>
          <SupabaseAppGate />
        </AppShell>
      </OrganizationProvider>
    </AuthProvider>
  );
}
