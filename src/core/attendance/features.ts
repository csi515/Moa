import type { IndustryType } from '@/core/industry/types';
import type { AcademySettings } from '@/types';
import type { AttendanceModuleSettings } from './types';

/** 업종별 출입(PIN) 모듈 기본값 — 사업장 설정으로 덮어씀 */
const INDUSTRY_ATTENDANCE_DEFAULT: Record<IndustryType, boolean> = {
  piano: true,
  pilates: false,
};

export function getDefaultAttendanceSettings(industry: IndustryType): AttendanceModuleSettings {
  return { enabled: INDUSTRY_ATTENDANCE_DEFAULT[industry] ?? false };
}

function normalizeIndustry(industry: IndustryType | string | null | undefined): IndustryType {
  return industry === 'pilates' ? 'pilates' : 'piano';
}

/**
 * 사업장별 출입 관리(핀번호) 활성화 여부.
 * settings.features.attendance.enabled 가 있으면 그 값을 쓰고,
 * 없으면 업종 기본값을 사용한다.
 */
export function isAttendanceModuleEnabled(
  settings: AcademySettings | null | undefined,
  industry: IndustryType | string | null | undefined
): boolean {
  const industryType = normalizeIndustry(industry);
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
