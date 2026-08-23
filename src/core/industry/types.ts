/** 지원 업종 타입 */
export type IndustryType = 'piano' | 'pilates' | 'skincare';

export interface IndustryOption {
  value: IndustryType;
  label: string;
  description: string;
}

export const INDUSTRY_OPTIONS: IndustryOption[] = [
  {
    value: 'piano',
    label: '피아노학원',
    description: '원생·출결·수강료·교재 중심 운영',
  },
  {
    value: 'pilates',
    label: '필라테스학원',
    description: '회원·예약·수업 종류·강사 스케줄 중심 운영',
  },
  {
    value: 'skincare',
    label: '1인 피부관리샵',
    description: '고객·예약·시술 메뉴·케어 프로그램 중심 운영',
  },
];

/** 예약·시술 메뉴를 쓰는 업종 (필라테스·피부샵) */
export function isBookingIndustry(industry?: string | null): boolean {
  return industry === 'pilates' || industry === 'skincare';
}

export function normalizeIndustryType(value?: string | null): IndustryType {
  if (value === 'pilates') return 'pilates';
  if (value === 'skincare') return 'skincare';
  return 'piano';
}

export function getIndustryLabel(value?: string | null): string {
  const type = normalizeIndustryType(value);
  return INDUSTRY_OPTIONS.find((o) => o.value === type)?.label ?? '학원';
}
