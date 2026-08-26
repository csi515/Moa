import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
import { getIndustryPlugin } from '@/core/industry/registry';
import type { AcademySettings } from '@/types';
import type { AttendanceModuleSettings } from './types';

export function getDefaultAttendanceSettings(industry: IndustryType): AttendanceModuleSettings {
  return { enabled: getIndustryPlugin(industry).attendanceDefault };
}

export function isAttendanceModuleEnabled(
  settings: AcademySettings | null | undefined,
  industry: IndustryType | string | null | undefined
): boolean {
  const industryType = normalizeIndustryType(industry);
  const featureFlag = settings?.features?.attendance?.enabled;
  if (typeof featureFlag === 'boolean') return featureFlag;
  return getIndustryPlugin(industryType).attendanceDefault;
}

/** settings 객체에 출입(PIN) on/off 반영 (불변) */
export function withAttendanceModuleEnabled(
  settings: AcademySettings,
  enabled: boolean
): AcademySettings {
  return {
    ...settings,
    features: {
      ...settings.features,
      attendance: {
        ...settings.features?.attendance,
        enabled,
      },
    },
  };
}
