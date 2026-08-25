import React from 'react';
import { AppProvider } from './context/AppContext';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { SupabaseRequiredScreen } from './shared/components/SupabaseRequiredScreen';
import { isSupabaseConfigured } from './lib/supabase';
import { isPublicBookingRoute, PublicConsultationBookingPage } from './core/consultations';

export default function App() {
  if (isPublicBookingRoute()) {
    if (!isSupabaseConfigured()) {
      return <SupabaseRequiredScreen />;
    }
    return <PublicConsultationBookingPage />;
  }

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
