import React, { Suspense, type ComponentType } from 'react';
import { useOrganization } from '../organizations/OrganizationProvider';
import { hasIndustryModule, normalizeIndustryType, type IndustryType } from './types';
import { ParentShell } from '@/modules/parent/ParentShell';
import { GenericIndustryShell } from './GenericIndustryShell';
import { LoadingScreen } from '@/shared/components/LoadingScreen';
import {
  BathIndustryApp,
  DaycareIndustryApp,
  GymIndustryApp,
  PianoIndustryApp,
  PilatesIndustryApp,
  RetailIndustryApp,
  SkinIndustryApp,
} from './industryModuleLoaders';

/** 전용 모듈이 있는 업종만 등록. 나머지는 GenericIndustryShell */
const APP_BY_INDUSTRY: Partial<Record<IndustryType, ComponentType>> = {
  piano: PianoIndustryApp,
  pilates: PilatesIndustryApp,
  gym: GymIndustryApp,
  daycare: DaycareIndustryApp,
  skin_clinic: SkinIndustryApp,
  retail: RetailIndustryApp,
  sauna_jjimjilbang: BathIndustryApp,
};

function resolveIndustryApp(industry: IndustryType): ComponentType {
  if (!hasIndustryModule(industry)) return GenericIndustryShell;
  return APP_BY_INDUSTRY[industry] ?? GenericIndustryShell;
}

/** organization.industry_type에 따라 해당 업종 셸만 lazy load */
export const IndustryAppRouter: React.FC = () => {
  const { currentOrganization, currentRole } = useOrganization();

  if (currentRole === 'parent') {
    return <ParentShell />;
  }

  const industry = normalizeIndustryType(currentOrganization?.industry_type);
  const IndustryApp = resolveIndustryApp(industry);

  return (
    <Suspense fallback={<LoadingScreen message="화면을 불러오는 중..." />}>
      <IndustryApp />
    </Suspense>
  );
};
