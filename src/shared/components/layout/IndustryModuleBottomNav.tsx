import React, { useMemo } from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import type { NavMenuItem } from '@/core/auth/navUtils';
import { ModuleBottomNav } from './ModuleBottomNav';
import type { ModuleTheme } from './moduleTheme';

interface Props<TLabels> {
  buildTabs: (labels: TLabels) => { mainTabs: NavMenuItem[]; moreTabs: NavMenuItem[] };
  useLabels: () => TLabels;
  moreMenuSubtitle: string;
  theme?: ModuleTheme;
}

/** 업종별 nav config를 주입받는 공통 하단 네비 */
export function IndustryModuleBottomNav<TLabels>({
  buildTabs,
  useLabels,
  moreMenuSubtitle,
  theme = 'indigo',
}: Props<TLabels>) {
  const labels = useLabels();
  const { allowedTabs } = usePermissions();
  const { mainTabs, moreTabs } = useMemo(() => buildTabs(labels), [buildTabs, labels]);

  return (
    <ModuleBottomNav
      mainTabs={mainTabs}
      moreTabs={moreTabs}
      allowedTabs={allowedTabs}
      moreMenuSubtitle={moreMenuSubtitle}
      theme={theme}
    />
  );
}
