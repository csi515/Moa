import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/piano';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavSections } from '@/core/auth/navUtils';
import { ModuleSidebar } from '@/shared/components/layout/ModuleSidebar';
import { buildAcademyNavSections } from '../config/nav';

/** 종합학원 사이드바 */
export const AcademySidebar: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs, roleLabel, roleBadge } = usePermissions();
  const sections = useMemo(
    () => filterNavSections(buildAcademyNavSections(labels), allowedTabs),
    [labels, allowedTabs]
  );

  return <ModuleSidebar sections={sections} roleBadge={roleBadge} roleLabel={roleLabel} />;
};
