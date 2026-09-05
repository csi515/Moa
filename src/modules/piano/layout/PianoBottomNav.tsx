import type { FC } from 'react';
import { useApp } from '@/context/AppContext';
import { useModuleLabels } from '@/core/labels';
import { usePermissions } from '@/core/auth/usePermissions';
import { filterNavTabs } from '@/core/auth/navUtils';
import { ModuleBottomNav } from '@/shared/components/layout/ModuleBottomNav';
import { getPianoMainTabs, getPianoMoreTabs } from '../config/nav';

export const PianoBottomNav: FC = () => {
  const { activeTab, setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const { allowedTabs } = usePermissions();

  return (
    <ModuleBottomNav
      theme="indigo"
      mainTabs={filterNavTabs(getPianoMainTabs(labels), allowedTabs)}
      moreTabs={filterNavTabs(getPianoMoreTabs(labels), allowedTabs)}
      activeTab={activeTab}
      onNavigate={(tab) => {
        if (tab === 'students') setSelectedStudentId(null);
        setActiveTab(tab);
      }}
      moreMenuTitle="더보기"
      moreMenuDescription="상담 · 수납 · 설정 · PIN 출석 및 부가 기능"
    />
  );
};
