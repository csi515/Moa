import type { AttendanceRecord, ClassItem, DayOfWeek, Student, StudentMonthlyBillingSummary } from '@/types';
import { formatCurrency, getAttendanceBadge, getInvoiceStatusBadge } from '@/utils/formatters';

const WEEKDAYS: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];

export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentYearMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** 오늘 요일 (한글 DayOfWeek) */
export function getTodayWeekday(): DayOfWeek {
  return WEEKDAYS[new Date().getDay()];
}

export function studentHasWeekday(
  student: Student,
  weekday: DayOfWeek,
  classById: Map<string, ClassItem>
): boolean {
  if (!student.classIds?.length) return false;
  return student.classIds.some((id) => {
    const cls = classById.get(id);
    return Boolean(cls?.daysOfWeek?.includes(weekday));
  });
}

export function getClassLabel(
  student: Student,
  classNameById: Map<string, string>
): string {
  if (!student.classIds?.length) return '미배정';
  const names = student.classIds
    .map((id) => classNameById.get(id))
    .filter(Boolean) as string[];
  if (names.length === 0) return `${student.classIds.length}개 레슨`;
  if (names.length === 1) return names[0];
  return `${names[0]} 외 ${names.length - 1}`;
}

export type AttendanceSignal = {
  label: string;
  tone: 'ok' | 'warn' | 'muted';
};

/** 오늘 출결 신호 (목록용) */
export function getTodayAttendanceSignal(
  studentId: string,
  todayAttendanceByStudent: Map<string, AttendanceRecord>
): AttendanceSignal {
  const record = todayAttendanceByStudent.get(studentId);
  if (!record) return { label: '미체크', tone: 'muted' };
  const badge = getAttendanceBadge(record.status);
  const tone: AttendanceSignal['tone'] =
    record.status === 'absent' ? 'warn' : record.status === 'present' || record.status === 'make_up' ? 'ok' : 'warn';
  return { label: badge.label, tone };
}

export type BillingSignal = {
  label: string;
  tone: 'ok' | 'warn' | 'muted';
};

/** 이번 달 수납 신호 (목록용) — 월회비+교재 미납 합산 */
export function getMonthBillingSignal(
  summary: StudentMonthlyBillingSummary | undefined
): BillingSignal {
  if (!summary) return { label: '-', tone: 'muted' };
  const unpaid = summary.totalUnpaid || 0;
  if (unpaid > 0) {
    return { label: `미납 ${formatCurrency(unpaid)}`, tone: 'warn' };
  }
  if ((summary.totalBilled || 0) > 0) {
    const statusLabel =
      summary.tuitionStatus === 'overdue'
        ? '연체'
        : getInvoiceStatusBadge(summary.tuitionStatus).label;
    return { label: statusLabel, tone: 'ok' };
  }
  return { label: '청구 없음', tone: 'muted' };
}

export function buildAttendanceByStudentToday(
  records: AttendanceRecord[],
  today: string
): Map<string, AttendanceRecord> {
  const map = new Map<string, AttendanceRecord>();
  for (const record of records) {
    if (record.date !== today) continue;
    const prev = map.get(record.studentId);
    if (!prev || (record.createdAt || '') > (prev.createdAt || '')) {
      map.set(record.studentId, record);
    }
  }
  return map;
}

export function buildBillingByStudent(
  summaries: StudentMonthlyBillingSummary[]
): Map<string, StudentMonthlyBillingSummary> {
  const map = new Map<string, StudentMonthlyBillingSummary>();
  summaries.forEach((s) => map.set(s.studentId, s));
  return map;
}

export const WEEKDAY_FILTER_OPTIONS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일'];
