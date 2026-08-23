import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/skincare';
import { usePermissions } from '@/core/auth/usePermissions';
import { ModuleBottomNav } from '@/shared/components/layout/ModuleBottomNav';
import { buildSkincareBottomNavTabs } from '../config/nav';

export const SkincareBottomNav: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs } = usePermissions();
  const { mainTabs, moreTabs } = useMemo(() => buildSkincareBottomNavTabs(labels), [labels]);

  return (
    <ModuleBottomNav
      mainTabs={mainTabs}
      moreTabs={moreTabs}
      allowedTabs={allowedTabs}
      moreMenuSubtitle="피부관리샵 운영 메뉴를 선택하세요"
      theme="rose"
    />
  );
};
