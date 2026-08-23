import React, { useMemo } from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavSections, type NavMenuSection } from '@/core/auth/navUtils';
import { ModuleSidebar } from './ModuleSidebar';
import type { ModuleTheme } from './moduleTheme';

interface Props<TLabels> {
  buildSections: (labels: TLabels) => NavMenuSection[];
  useLabels: () => TLabels;
  theme?: ModuleTheme;
}

/** 업종별 nav config를 주입받는 공통 사이드바 */
export function IndustryModuleSidebar<TLabels>({
  buildSections,
  useLabels,
  theme = 'indigo',
}: Props<TLabels>) {
  const labels = useLabels();
  const { allowedTabs, roleLabel, roleBadge } = usePermissions();
  const sections = useMemo(
    () => filterNavSections(buildSections(labels), allowedTabs),
    [buildSections, labels, allowedTabs]
  );

  return (
    <ModuleSidebar sections={sections} roleBadge={roleBadge} roleLabel={roleLabel} theme={theme} />
  );
}
