/** 지원 업종 타입 */
export type IndustryType = 'piano' | 'pilates' | 'gym';

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
    value: 'gym',
    label: '체육관',
    description: '회원·수업반·출결·수강료 중심 운영',
  },
];

export function normalizeIndustryType(value?: string | null): IndustryType {
  if (value === 'pilates') return 'pilates';
  // 레거시 키 호환 (구 태권도장 → 체육관)
  if (value === 'gym' || value === 'taekwondo') return 'gym';
  return 'piano';
}

export function getIndustryLabel(value?: string | null): string {
  const type = normalizeIndustryType(value);
  return INDUSTRY_OPTIONS.find((o) => o.value === type)?.label ?? '학원';
}
