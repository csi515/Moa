import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
import type { AcademySettings } from '@/types';
import type { AttendanceModuleSettings } from './types';

/** 업종별 출입(PIN) 모듈 기본값 — 사업장 설정으로 덮어씀 */
const INDUSTRY_ATTENDANCE_DEFAULT: Record<IndustryType, boolean> = {
  piano: true,
  pilates: false,
  taekwondo: true,
};

export function getDefaultAttendanceSettings(industry: IndustryType): AttendanceModuleSettings {
  return { enabled: INDUSTRY_ATTENDANCE_DEFAULT[industry] ?? false };
}

export function isAttendanceModuleEnabled(
  settings: AcademySettings | null | undefined,
  industry: IndustryType | string | null | undefined
): boolean {
  const industryType = normalizeIndustryType(industry);
  const featureFlag = settings?.features?.attendance?.enabled;
  if (typeof featureFlag === 'boolean') return featureFlag;
  return INDUSTRY_ATTENDANCE_DEFAULT[industryType];
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
