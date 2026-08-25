import type { ReactNode } from 'react';
import { Header } from './Header';
import type { ModuleTheme } from './moduleTheme';
import { MODULE_THEMES } from './moduleTheme';

interface ModuleAppShellProps {
  theme: ModuleTheme;
  sidebar: ReactNode;
  bottomNav: ReactNode;
  children: ReactNode;
  /** Header 위 (예: SupabaseRoleSync) */
  beforeHeader?: ReactNode;
  /** FAB, Toast, Confirm 등 */
  overlays?: ReactNode;
}

/**
 * 모듈 공통 앱 셸 — Header + 사이드바 + 메인 + 하단 네비.
 */
export function ModuleAppShell({
  theme,
  sidebar,
  bottomNav,
  children,
  beforeHeader,
  overlays,
}: ModuleAppShellProps) {
  const t = MODULE_THEMES[theme];

  return (
    <div className={t.shell}>
      {beforeHeader}
      <Header />
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {sidebar}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>
      {bottomNav}
      {overlays}
    </div>
  );
}
