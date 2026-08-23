import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/piano';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavSections } from '@/core/auth/navUtils';
import { ModuleSidebar } from '@/shared/components/layout/ModuleSidebar';
import { buildPianoNavSections } from '../config/nav';

export const PianoSidebar: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs, roleLabel, roleBadge } = usePermissions();
  const sections = useMemo(
    () => filterNavSections(buildPianoNavSections(labels), allowedTabs),
    [labels, allowedTabs]
  );

  return (
    <ModuleSidebar sections={sections} roleBadge={roleBadge} roleLabel={roleLabel} theme="indigo" />
  );
};
