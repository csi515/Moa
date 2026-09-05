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

/** settings 객체에 PIN 출결 on/off 반영 (불변) */
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

/**
 * 기존 org에 features.attendance.enabled가 없을 때 기본값 확정.
 * PIN/세션 데이터가 있으면 true(기존 PIN 학원 보호), 없으면 false(MANUAL).
 */
export function resolveAttendanceEnabledForBackfill(params: {
  settings: AcademySettings;
  hasPinOrSessionData: boolean;
}): { settings: AcademySettings; changed: boolean; enabled: boolean } {
  if (typeof params.settings.features?.attendance?.enabled === 'boolean') {
    return {
      settings: params.settings,
      changed: false,
      enabled: params.settings.features.attendance.enabled,
    };
  }
  const enabled = params.hasPinOrSessionData;
  return {
    settings: withAttendanceModuleEnabled(params.settings, enabled),
    changed: true,
    enabled,
  };
}
