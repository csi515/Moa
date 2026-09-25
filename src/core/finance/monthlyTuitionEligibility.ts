import { isMonthlyBillingStudent } from '@/core/academy/utils/billingMode';
import type { Student } from '@/types';

type EligibleStudent = Pick<Student, 'billingMode' | 'status' | 'joinDate'>;

function yearMonthOf(date?: string): string {
  return (date || '').slice(0, 7);
}

/** 해당 연월 말일 이후에 입학한 원생 — 그 달 월회비는 발생하지 않음 */
function joinedAfterYearMonth(joinDate: string | undefined, yearMonth: string): boolean {
  const joinedMonth = yearMonthOf(joinDate);
  return Boolean(joinedMonth) && joinedMonth > yearMonth;
}

/**
 * 특정 월의 월회비 자동 생성 대상인지.
 * 기존 일괄 생성(`generateMonthlyInvoicesForAllActive`)과 같이
 * 재원(`active`) + 월회비만 포함한다.
 * 휴원(`leave`)·퇴원(`withdrawn`)·회차권은 제외한다.
 * 입학일이 선택 월보다 이후면 그 달은 제외한다.
 */
export function isMonthlyTuitionAutoGenerateEligible(
  student: EligibleStudent,
  yearMonth: string
): boolean {
  if (!isMonthlyBillingStudent(student)) return false;
  if (student.status !== 'active') return false;
  if (joinedAfterYearMonth(student.joinDate, yearMonth)) return false;
  return true;
}

export function filterMonthlyTuitionAutoGenerateStudents<T extends EligibleStudent>(
  students: T[],
  yearMonth: string
): T[] {
  return students.filter((student) => isMonthlyTuitionAutoGenerateEligible(student, yearMonth));
}
