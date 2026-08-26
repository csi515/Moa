import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
import { getIndustryPlugin } from '@/core/industry/registry';
import type { StudentLevel } from '@/types';

export const PIANO_LEVEL_OPTIONS: StudentLevel[] = [
  '바이엘 상',
  '바이엘 하',
  '체르니 100',
  '체르니 30',
  '체르니 40',
  '체르니 50',
  '소나티네/명곡',
  '작품집/쇼팽',
  '입시/콩쿠르',
  '성인 취미',
];

export const GYM_LEVEL_OPTIONS: StudentLevel[] = [
  '어린이',
  '초급',
  '중급',
  '고급',
  '선수반',
  '성인',
  '시니어',
];

/** 어린이집 — 연령반 */
export const DAYCARE_LEVEL_OPTIONS: StudentLevel[] = [
  '0세반',
  '1세반',
  '2세반',
  '3세반',
  '4세반',
  '5세반',
  '혼합반',
  '방과후',
];

const LEVELS_BY_INDUSTRY: Partial<Record<IndustryType, StudentLevel[]>> = {
  piano: PIANO_LEVEL_OPTIONS,
  gym: GYM_LEVEL_OPTIONS,
  daycare: DAYCARE_LEVEL_OPTIONS,
};

/** 업종별 회원/원생 레벨 선택지 */
export function getStudentLevelOptions(
  industry: IndustryType | string | null | undefined
): StudentLevel[] {
  const type = normalizeIndustryType(industry);
  return LEVELS_BY_INDUSTRY[type] ?? PIANO_LEVEL_OPTIONS;
}

/** 업종별 레벨 필드 라벨 */
export function getStudentLevelLabel(
  industry: IndustryType | string | null | undefined
): string {
  return getIndustryPlugin(industry).levelLabel;
}

/** 학교/학년 필드 표시 여부 */
export function showSchoolFields(industry: IndustryType | string | null | undefined): boolean {
  return getIndustryPlugin(industry).showSchoolFields;
}
