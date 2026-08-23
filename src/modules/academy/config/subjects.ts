import type { AcademySettings } from '@/types';

/** 종합학원에서 선택 가능한 전체 과목 카탈로그 */
export const ACADEMY_SUBJECT_CATALOG: { id: string; label: string }[] = [
  { id: 'korean', label: '국어' },
  { id: 'math', label: '수학' },
  { id: 'english', label: '영어' },
  { id: 'science', label: '과학' },
  { id: 'social', label: '사회' },
  { id: 'history', label: '역사' },
  { id: 'essay', label: '논술' },
  { id: 'chinese', label: '한문' },
  { id: 'other', label: '기타' },
];

export const DEFAULT_ACADEMY_SUBJECT_IDS = ['korean', 'math', 'english'];

const catalogById = new Map(ACADEMY_SUBJECT_CATALOG.map((s) => [s.id, s]));
const catalogByLabel = new Map(ACADEMY_SUBJECT_CATALOG.map((s) => [s.label, s]));

/** 학원 설정에 저장된 운영 과목 ID 목록 (미설정 시 국·수·영) */
export function getAcademySubjectIds(settings?: AcademySettings | null): string[] {
  const selected = settings?.academySubjects?.filter(Boolean);
  if (selected && selected.length > 0) return selected;
  return [...DEFAULT_ACADEMY_SUBJECT_IDS];
}

/** 운영 중인 과목 옵션 (라벨 포함) */
export function getAcademySubjectOptions(settings?: AcademySettings | null) {
  const ids = getAcademySubjectIds(settings);
  return ACADEMY_SUBJECT_CATALOG.filter((s) => ids.includes(s.id));
}

/** 과목 ID 또는 라벨 → 표시 라벨 */
export function getAcademySubjectLabel(idOrLabel: string): string {
  return catalogById.get(idOrLabel)?.label ?? catalogByLabel.get(idOrLabel)?.label ?? idOrLabel;
}

/** 과목 라벨 → ID (없으면 라벨 그대로) */
export function getAcademySubjectId(labelOrId: string): string {
  return catalogById.get(labelOrId)?.id ?? catalogByLabel.get(labelOrId)?.id ?? labelOrId;
}
