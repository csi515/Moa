import React, { ReactNode, useEffect, useState } from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import {
  Header,
  PwaInstallPrompt,
  DirectorFloatingFab,
  ToastContainer,
  ConfirmDialog,
  OnboardingWizard,
} from '@/shared/components';
import { SupabaseRoleSync } from '@/SupabaseRoleSync';
import { isSupabaseConfigured } from '@/lib/supabase';
import { StorageService } from '@/services/storage';
import { MODULE_THEMES, type ModuleTheme } from './moduleTheme';

interface Props {
  sidebar: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
  theme?: ModuleTheme;
  shellClassName?: string;
}

/** 업종 앱 공통 셸 (헤더·사이드·하단·FAB·온보딩) */
export const ModuleAppShell: React.FC<Props> = ({
  sidebar,
  bottomNav,
  children,
  theme = 'indigo',
  shellClassName,
}) => {
  const { isAdmin, isOwner } = usePermissions();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const resolvedShell = shellClassName ?? MODULE_THEMES[theme].shell;

  useEffect(() => {
    if (isAdmin) {
      setShowOnboarding(StorageService.shouldShowOnboarding());
    }
  }, [isAdmin]);

  return (
    <div className={resolvedShell}>
      {isSupabaseConfigured() && <SupabaseRoleSync />}
      <Header />
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {sidebar}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      {bottomNav}
      {isOwner && <DirectorFloatingFab />}
      <PwaInstallPrompt />
      {showOnboarding && <OnboardingWizard onComplete={() => setShowOnboarding(false)} />}
      <ConfirmDialog />
      <ToastContainer />
    </div>
  );
};
