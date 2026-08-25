import type { IndustryType } from '@/core/industry/types';

export interface CategoryOption {
  value: string;
  label: string;
}

/** 업종 공통 지출 카테고리 */
export const COMMON_EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: 'rent', label: '임대료' },
  { value: 'utility', label: '관리비/공과금' },
  { value: 'maintenance', label: '시설 유지보수' },
  { value: 'salary', label: '인건비/급여' },
  { value: 'supplies', label: '소모품/비품' },
  { value: 'marketing', label: '홍보/마케팅' },
  { value: 'insurance', label: '보험' },
  { value: 'tax', label: '세금/공과' },
  { value: 'other', label: '기타' },
];

/** 피아노 학원 추가 지출 카테고리 */
export const PIANO_EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: 'piano_tuning', label: '피아노 조율/수리' },
  { value: 'textbook', label: '교재/악보 구입' },
  { value: 'snacks', label: '간식/다과' },
  { value: 'teacher_salary', label: '강사료' },
];

/** 필라테스 스튜디오 추가 지출 카테고리 */
export const PILATES_EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: 'equipment', label: '기구/장비' },
  { value: 'cleaning', label: '청소/위생' },
  { value: 'instructor_fee', label: '강사료' },
];

/** 업종 공통 수입 카테고리 */
export const COMMON_INCOME_CATEGORIES: CategoryOption[] = [
  { value: 'membership', label: '회원권/정기 수입' },
  { value: 'session', label: '수업/세션 매출' },
  { value: 'product', label: '상품 판매' },
  { value: 'rental', label: '대관/임대 수입' },
  { value: 'grant', label: '지원금/보조금' },
  { value: 'other', label: '기타 수입' },
];

/** 태권도장 추가 지출 카테고리 */
export const TAEKWONDO_EXPENSE_CATEGORIES: CategoryOption[] = [
  { value: 'uniform', label: '도복/장비' },
  { value: 'competition', label: '시합/승급 비용' },
  { value: 'instructor_fee', label: '사범료' },
];

export function getExpenseCategories(industry: IndustryType | string): CategoryOption[] {
  const base = [...COMMON_EXPENSE_CATEGORIES];
  if (industry === 'pilates') {
    return [...base, ...PILATES_EXPENSE_CATEGORIES];
  }
  if (industry === 'taekwondo') {
    return [...base, ...TAEKWONDO_EXPENSE_CATEGORIES];
  }
  return [...base, ...PIANO_EXPENSE_CATEGORIES];
}

export function getIncomeCategories(_industry: IndustryType | string): CategoryOption[] {
  return COMMON_INCOME_CATEGORIES;
}

export function getCategoryLabel(
  categories: CategoryOption[],
  value?: string
): string {
  if (!value) return '기타';
  return categories.find((c) => c.value === value)?.label || value;
}

/** 최근 N개월 YYYY-MM 목록 */
export function getRecentYearMonths(count = 12): { value: string; label: string }[] {
  const result: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = d.toISOString().slice(0, 7);
    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    result.push({ value: ym, label });
  }
  return result;
}
