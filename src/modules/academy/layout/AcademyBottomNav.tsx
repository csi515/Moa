import React, { useMemo } from 'react';
import { useModuleLabels } from '@/modules/piano';
import { usePermissions } from '@/core/auth/usePermissions';
import { ModuleBottomNav } from '@/shared/components/layout/ModuleBottomNav';
import { buildAcademyBottomNavTabs } from '../config/nav';

/** 종합학원 모바일 하단 네비 */
export const AcademyBottomNav: React.FC = () => {
  const labels = useModuleLabels();
  const { allowedTabs } = usePermissions();
  const { mainTabs, moreTabs } = useMemo(() => buildAcademyBottomNavTabs(labels), [labels]);

  return (
    <ModuleBottomNav
      mainTabs={mainTabs}
      moreTabs={moreTabs}
      allowedTabs={allowedTabs}
      moreMenuSubtitle="종합학원 운영 메뉴를 선택하세요"
      theme="indigo"
    />
  );
};
