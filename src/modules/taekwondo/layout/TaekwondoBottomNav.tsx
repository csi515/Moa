import type { FC } from 'react';
import { useApp } from '@/context/AppContext';
import { useModuleLabels } from '@/core/labels';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavTabs } from '@/core/auth/navUtils';
import { ModuleBottomNav } from '@/shared/components/layout/ModuleBottomNav';
import { getTaekwondoMainTabs, getTaekwondoMoreTabs } from '../config/nav';

export const TaekwondoBottomNav: FC = () => {
  const { activeTab, setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const { allowedTabs } = usePermissions();

  return (
    <ModuleBottomNav
      theme="red"
      mainTabs={filterNavTabs(getTaekwondoMainTabs(labels), allowedTabs)}
      moreTabs={filterNavTabs(getTaekwondoMoreTabs(labels), allowedTabs)}
      activeTab={activeTab}
      onNavigate={(tab) => {
        if (tab === 'students') setSelectedStudentId(null);
        setActiveTab(tab);
      }}
      moreMenuTitle="전체 메뉴"
      moreMenuDescription="태권도장 운영 메뉴를 선택하세요"
    />
  );
};
