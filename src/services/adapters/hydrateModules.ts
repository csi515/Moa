import { normalizeIndustryType } from '@/core/industry/types';

/** hydrate 시 industry별 모듈 로드 여부 (Core는 항상) */
export function resolveHydrateModules(industryType?: string | null): {
  piano: boolean;
  education: boolean;
  daycare: boolean;
} {
  const industry = normalizeIndustryType(industryType);
  const piano = industry === 'piano';
  return {
    piano,
    education: piano,
    daycare: industry === 'daycare',
  };
}
