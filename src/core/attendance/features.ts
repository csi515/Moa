import type { IndustryType } from '@/core/industry/types';
import type { AcademySettings } from '@/types';
import type { AttendanceModuleSettings } from './types';

/** 업종별 출결 모듈 기본 지원 여부 */
const INDUSTRY_ATTENDANCE_DEFAULT: Record<IndustryType, boolean> = {
  piano: true,
  academy: true,
  pilates: false,
  skincare: false,
};

export function getDefaultAttendanceSettings(industry: IndustryType): AttendanceModuleSettings {
  return { enabled: INDUSTRY_ATTENDANCE_DEFAULT[industry] ?? false };
}

/** 출결 Industry Module 활성화 여부 */
export function isAttendanceModuleEnabled(
  settings: AcademySettings | null | undefined,
  industry: IndustryType | string | null | undefined
): boolean {
  const industryType =
    industry === 'pilates'
      ? 'pilates'
      : industry === 'skincare'
        ? 'skincare'
        : industry === 'academy'
          ? 'academy'
          : 'piano';
  const featureFlag = settings?.features?.attendance?.enabled;
  if (typeof featureFlag === 'boolean') return featureFlag;
  return INDUSTRY_ATTENDANCE_DEFAULT[industryType];
}
