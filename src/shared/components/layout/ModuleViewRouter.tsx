import React, { ReactNode } from 'react';
import { useApp } from '@/context/AppContext';
import { useTabGuard } from '@/core/auth/useTabGuard';
import { ModuleAppShell } from './ModuleAppShell';
import type { ModuleTheme } from './moduleTheme';

interface Props {
  views: Record<string, React.FC>;
  fallback: React.FC;
  theme: ModuleTheme;
  sidebar: ReactNode;
  bottomNav: ReactNode;
  shellClassName?: string;
}

/** 업종 앱 공통 view registry 라우터 */
export const ModuleViewRouter: React.FC<Props> = ({
  views,
  fallback,
  theme,
  sidebar,
  bottomNav,
  shellClassName,
}) => {
  const { activeTab } = useApp();
  useTabGuard();

  const View = views[activeTab] ?? fallback;

  return (
    <ModuleAppShell
      theme={theme}
      shellClassName={shellClassName}
      sidebar={sidebar}
      bottomNav={bottomNav}
    >
      <View />
    </ModuleAppShell>
  );
};
