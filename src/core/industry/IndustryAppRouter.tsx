import React from 'react';
import { useOrganization } from '../organizations/OrganizationProvider';
import { normalizeIndustryType, type IndustryType } from './types';
import { ModuleLabelsProvider as PianoLabelsProvider } from '@/modules/piano';
import { ModuleLabelsProvider as PilatesLabelsProvider } from '@/modules/pilates';
import { ModuleLabelsProvider as SkincareLabelsProvider } from '@/modules/skincare';
import { PianoAppContent } from '@/modules/piano/PianoAppContent';
import { PilatesAppContent } from '@/modules/pilates/PilatesAppContent';
import { SkincareAppContent } from '@/modules/skincare/SkincareAppContent';
import { ParentAppContent } from '@/modules/parent/ParentAppContent';

const APP_BY_INDUSTRY: Record<
  IndustryType,
  { LabelsProvider: React.FC<{ children: React.ReactNode }>; AppContent: React.FC }
> = {
  piano: { LabelsProvider: PianoLabelsProvider, AppContent: PianoAppContent },
  pilates: { LabelsProvider: PilatesLabelsProvider, AppContent: PilatesAppContent },
  skincare: { LabelsProvider: SkincareLabelsProvider, AppContent: SkincareAppContent },
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
