import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/pilates';
import { usePermissions } from '@/core/auth/usePermissions';
import { ModuleBottomNav } from '@/shared/components/layout/ModuleBottomNav';
import { buildPilatesBottomNavTabs } from '../config/nav';

export const PilatesBottomNav: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs } = usePermissions();
  const { mainTabs, moreTabs } = useMemo(() => buildPilatesBottomNavTabs(labels), [labels]);

  return (
    <ModuleBottomNav
      mainTabs={mainTabs}
      moreTabs={moreTabs}
      allowedTabs={allowedTabs}
      moreMenuSubtitle="필라테스 스튜디오 운영 메뉴를 선택하세요"
      theme="teal"
    />
  );
};
