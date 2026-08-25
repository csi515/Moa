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

export const TAEKWONDO_BELT_OPTIONS: StudentLevel[] = [
  '흰띠(예비)',
  '10급',
  '9급',
  '8급',
  '7급',
  '6급',
  '5급',
  '4급',
  '3급',
  '2급',
  '1급',
  '1단',
  '2단',
  '3단',
  '4단',
  '5단',
  '6단',
  '7단',
  '8단',
  '9단',
];

/** 업종별 수련생/원생 급·레벨 선택지 */
export function getStudentLevelOptions(
  industry: IndustryType | string | null | undefined
): StudentLevel[] {
  const type = normalizeIndustryType(industry);
  if (type === 'taekwondo') return TAEKWONDO_BELT_OPTIONS;
  return PIANO_LEVEL_OPTIONS;
}

/** 업종별 레벨 필드 라벨 */
export function getStudentLevelLabel(
  industry: IndustryType | string | null | undefined
): string {
  return normalizeIndustryType(industry) === 'taekwondo' ? '띠/급' : '레벨';
}

/** 태권도장은 학교/학년 필드 숨김 */
export function showSchoolFields(industry: IndustryType | string | null | undefined): boolean {
  return normalizeIndustryType(industry) !== 'taekwondo';
}
