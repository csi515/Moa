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
