import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/pilates';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavSections } from '@/core/auth/navUtils';
import { ModuleSidebar } from '@/shared/components/layout/ModuleSidebar';
import { buildPilatesNavSections } from '../config/nav';

export const PilatesSidebar: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs, roleLabel, roleBadge } = usePermissions();
  const sections = useMemo(
    () => filterNavSections(buildPilatesNavSections(labels), allowedTabs),
    [labels, allowedTabs]
  );

  return (
    <ModuleSidebar sections={sections} roleBadge={roleBadge} roleLabel={roleLabel} theme="teal" />
  );
};
