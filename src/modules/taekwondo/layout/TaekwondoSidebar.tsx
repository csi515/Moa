import type { FC } from 'react';
import { useApp } from '@/context/AppContext';
import { useModuleLabels } from '@/core/labels';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavSections } from '@/core/auth/navUtils';
import { ModuleSidebar } from '@/shared/components/layout/ModuleSidebar';
import { getTaekwondoSidebarSections } from '../config/nav';

export const TaekwondoSidebar: FC = () => {
  const { activeTab, setActiveTab, currentUser, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const { allowedTabs, roleLabel, roleBadge } = usePermissions();

  const sections = filterNavSections(getTaekwondoSidebarSections(labels), allowedTabs);

  return (
    <ModuleSidebar
      theme="red"
      sections={sections}
      activeTab={activeTab}
      onNavigate={(tab) => {
        if (tab === 'students') setSelectedStudentId(null);
        setActiveTab(tab);
      }}
      user={{ name: currentUser.name, roleLabel, roleBadge }}
    />
  );
};
