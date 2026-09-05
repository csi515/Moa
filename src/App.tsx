import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { SupabaseAppGate } from './SupabaseAppGate';
import { AuthProvider } from './core/auth/AuthProvider';
import { OrganizationProvider } from './core/organizations/OrganizationProvider';
import { SupabaseRequiredScreen } from './shared/components/SupabaseRequiredScreen';
import { isSupabaseConfigured } from './lib/supabase';
import { MobileBootstrap } from './core/platform';
import { getPublicLegalPage, LegalPageView, type LegalPageId } from './core/legal';
import { PublicOrgLanding } from './core/public/PublicOrgLanding';
import { CustomerSignUpFlow } from './core/customer/CustomerSignUpFlow';
import { AttendanceKioskPage } from './core/attendance';

function PublicOrgRoute() {
  const { code } = useParams<{ code: string }>();
  if (!code) return <Navigate to="/" replace />;
  return <PublicOrgLanding code={code} />;
}

function CustomerSignUpRoute() {
  return <CustomerSignUpFlow />;
}

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
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <AppProvider>
            <MobileBootstrap />
            <Routes>
              {/* Public organization landing page */}
              <Route path="/c/:code" element={<PublicOrgRoute />} />
              
              {/* Customer sign-up flow */}
              <Route path="/signup/customer" element={<CustomerSignUpRoute />} />
              
              <Route path="/attendance-kiosk" element={<AttendanceKioskPage />} />
              
              {/* Main app */}
              <Route path="/*" element={<SupabaseAppGate />} />
            </Routes>
          </AppProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
