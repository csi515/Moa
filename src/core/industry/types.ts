/** 지원 업종 타입 */
export type IndustryType = 'piano' | 'pilates' | 'gym' | 'daycare';

export interface IndustryOption {
  value: IndustryType;
  label: string;
  description: string;
}

/** UI 선택용 — 플러그인 매니페스트와 동기화 유지 */
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
  {
    value: 'daycare',
    label: '어린이집',
    description: '원아·보호자·반·출결·보육료 중심 운영',
  },
];

export function normalizeIndustryType(value?: string | null): IndustryType {
  if (value === 'pilates') return 'pilates';
  if (value === 'gym' || value === 'taekwondo') return 'gym';
  if (value === 'daycare' || value === 'preschool' || value === 'kindergarten') {
    return 'daycare';
  }
  return 'piano';
}

export function getIndustryLabel(value?: string | null): string {
  const type = normalizeIndustryType(value);
  return INDUSTRY_OPTIONS.find((o) => o.value === type)?.label ?? '학원';
}
