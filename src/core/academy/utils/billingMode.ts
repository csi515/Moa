import { normalizeBillingMode, type Student, type StudentBillingMode } from '@/types';

/** 월회비 청구 대상인지 */
export function isMonthlyBillingStudent(student: Pick<Student, 'billingMode'>): boolean {
  return normalizeBillingMode(student.billingMode) === 'monthly';
}

/** 회차권 차감 대상인지 */
export function isSessionPassBillingStudent(student: Pick<Student, 'billingMode'>): boolean {
  return normalizeBillingMode(student.billingMode) === 'session_pass';
}

export function resolveDefaultBillingMode(
  settingsMode?: StudentBillingMode | string | null
): StudentBillingMode {
  return normalizeBillingMode(settingsMode);
}

/** 월청구 대상 학생 필터 (개별·일괄 청구 UI 공통) */
export function filterMonthlyBillingStudents<T extends Pick<Student, 'billingMode' | 'status'>>(
  students: T[],
  options?: { activeOnly?: boolean }
): T[] {
  return students.filter((s) => {
    if (options?.activeOnly && s.status !== 'active') return false;
    return isMonthlyBillingStudent(s);
  });
}
