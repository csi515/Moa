import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/piano';
import { usePermissions } from '@/core/auth/usePermissions';
import { ModuleBottomNav } from '@/shared/components/layout/ModuleBottomNav';
import { buildPianoBottomNavTabs } from '../config/nav';

export const PianoBottomNav: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs } = usePermissions();
  const { mainTabs, moreTabs } = useMemo(() => buildPianoBottomNavTabs(labels), [labels]);

  return (
    <ModuleBottomNav
      mainTabs={mainTabs}
      moreTabs={moreTabs}
      allowedTabs={allowedTabs}
      moreMenuSubtitle="피아노학원 운영 메뉴를 선택하세요"
      theme="indigo"
    />
  );
};
