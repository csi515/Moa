import React from 'react';
import { useOrganization } from '../organizations/OrganizationProvider';
import { hasIndustryModule, normalizeIndustryType, type IndustryType } from './types';
import { ModuleLabelsProvider as PianoLabelsProvider } from '@/modules/piano';
import { ModuleLabelsProvider as PilatesLabelsProvider } from '@/modules/pilates';
import { ModuleLabelsProvider as GymLabelsProvider } from '@/modules/gym';
import { ModuleLabelsProvider as DaycareLabelsProvider } from '@/modules/daycare';
import { PianoAppContent } from '@/modules/piano/PianoAppContent';
import { PilatesAppContent } from '@/modules/pilates/PilatesAppContent';
import { GymAppContent } from '@/modules/gym/GymAppContent';
import { DaycareAppContent } from '@/modules/daycare/DaycareAppContent';
import { ParentShell } from '@/modules/parent/ParentShell';
import { GenericIndustryShell } from './GenericIndustryShell';

type AppEntry = {
  LabelsProvider: React.FC<{ children: React.ReactNode }>;
  AppContent: React.FC;
};

/** 전용 모듈이 있는 업종만 등록. 나머지는 GenericIndustryShell */
const APP_BY_INDUSTRY: Partial<Record<IndustryType, AppEntry>> = {
  piano: { LabelsProvider: PianoLabelsProvider, AppContent: PianoAppContent },
  pilates: { LabelsProvider: PilatesLabelsProvider, AppContent: PilatesAppContent },
  gym: { LabelsProvider: GymLabelsProvider, AppContent: GymAppContent },
  daycare: { LabelsProvider: DaycareLabelsProvider, AppContent: DaycareAppContent },
};

const GENERIC_ENTRY: AppEntry = {
  LabelsProvider: ({ children }) => <>{children}</>,
  AppContent: GenericIndustryShell,
};

function resolveAppEntry(industry: IndustryType): AppEntry {
  if (!hasIndustryModule(industry)) return GENERIC_ENTRY;
  return APP_BY_INDUSTRY[industry] ?? GENERIC_ENTRY;
}

/** organization.industry_type에 따라 업종별 앱 셸 로드 */
export const IndustryAppRouter: React.FC = () => {
  const { currentOrganization, currentRole } = useOrganization();

  if (currentRole === 'parent') {
    return <ParentShell />;
  }

  const industry = normalizeIndustryType(currentOrganization?.industry_type);
  const { LabelsProvider, AppContent } = resolveAppEntry(industry);

  return (
    <LabelsProvider>
      <AppContent />
    </LabelsProvider>
  );
};
