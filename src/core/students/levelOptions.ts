import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
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

/** 체육관 — 수업/프로그램 레벨 */
export const GYM_LEVEL_OPTIONS: StudentLevel[] = [
  '어린이',
  '초급',
  '중급',
  '고급',
  '선수반',
  '성인',
  '시니어',
];

/** 업종별 회원/원생 레벨 선택지 */
export function getStudentLevelOptions(
  industry: IndustryType | string | null | undefined
): StudentLevel[] {
  const type = normalizeIndustryType(industry);
  if (type === 'gym') return GYM_LEVEL_OPTIONS;
  return PIANO_LEVEL_OPTIONS;
}

/** 업종별 레벨 필드 라벨 */
export function getStudentLevelLabel(
  industry: IndustryType | string | null | undefined
): string {
  return normalizeIndustryType(industry) === 'gym' ? '수업 레벨' : '레벨';
}

/** 체육관은 학교/학년 필드를 기본 숨김 */
export function showSchoolFields(industry: IndustryType | string | null | undefined): boolean {
  return normalizeIndustryType(industry) !== 'gym';
}
