import React from 'react';
import { useOrganization } from '../organizations/OrganizationProvider';
import { normalizeIndustryType, type IndustryType } from './types';
import { ModuleLabelsProvider as PianoLabelsProvider } from '@/modules/piano';
import { ModuleLabelsProvider as PilatesLabelsProvider } from '@/modules/pilates';
import { ModuleLabelsProvider as GymLabelsProvider } from '@/modules/gym';
import { ModuleLabelsProvider as DaycareLabelsProvider } from '@/modules/daycare';
import { PianoAppContent } from '@/modules/piano/PianoAppContent';
import { PilatesAppContent } from '@/modules/pilates/PilatesAppContent';
import { GymAppContent } from '@/modules/gym/GymAppContent';
import { DaycareAppContent } from '@/modules/daycare/DaycareAppContent';
import { ParentAppContent } from '@/modules/parent/ParentAppContent';

/** 업종 플러그인 → 앱 셸 등록표 */
const APP_BY_INDUSTRY: Record<
  IndustryType,
  { LabelsProvider: React.FC<{ children: React.ReactNode }>; AppContent: React.FC }
> = {
  piano: { LabelsProvider: PianoLabelsProvider, AppContent: PianoAppContent },
  pilates: { LabelsProvider: PilatesLabelsProvider, AppContent: PilatesAppContent },
  gym: { LabelsProvider: GymLabelsProvider, AppContent: GymAppContent },
  daycare: { LabelsProvider: DaycareLabelsProvider, AppContent: DaycareAppContent },
};

/** organization.industry_type에 따라 업종별 앱 셸 로드 */
export const IndustryAppRouter: React.FC = () => {
  const { currentOrganization, currentRole } = useOrganization();

  if (currentRole === 'parent') {
    return <ParentAppContent />;
  }

  const industry = normalizeIndustryType(currentOrganization?.industry_type);
  const { LabelsProvider, AppContent } = APP_BY_INDUSTRY[industry];

  return (
    <LabelsProvider>
      <AppContent />
    </LabelsProvider>
  );
};
