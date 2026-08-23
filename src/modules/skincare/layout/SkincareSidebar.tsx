import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/skincare';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavSections } from '@/core/auth/navUtils';
import { ModuleSidebar } from '@/shared/components/layout/ModuleSidebar';
import { buildSkincareNavSections } from '../config/nav';

export const SkincareSidebar: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs, roleLabel, roleBadge } = usePermissions();
  const sections = useMemo(
    () => filterNavSections(buildSkincareNavSections(labels), allowedTabs),
    [labels, allowedTabs]
  );

  return (
    <ModuleSidebar sections={sections} roleBadge={roleBadge} roleLabel={roleLabel} theme="rose" />
  );
};
