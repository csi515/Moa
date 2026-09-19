import type { AttendanceRecord, AttendanceStatus, Student } from '@/types';
import { StorageService } from '@/services/storage';
import { applySessionPassForAttendance } from '../../services/lessonPassConsume';
export {
  DAY_ATTENDANCE_CLASS_ID,
  DAY_ATTENDANCE_CLASS_NAME,
} from '@/core/attendance/dayAttendance';
export { todayIsoLocal, shiftDateIso } from '@/shared/utils/localDate';

export type DayStatus = 'unchecked' | 'present' | 'absent' | 'late';
export type StatusFilter = 'ALL' | DayStatus;

export const STATUS_META: Record<
  DayStatus,
  { label: string; tone: string; button: string; active: string }
> = {
  unchecked: {
    label: '미등원',
    tone: 'bg-slate-100 text-slate-600',
    button: 'border-slate-200 text-slate-600 hover:bg-slate-50',
    active: 'bg-slate-700 text-white border-slate-700',
  },
  present: {
    label: '등원',
    tone: 'bg-emerald-50 text-emerald-700',
    button: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    active: 'bg-emerald-600 text-white border-emerald-600',
  },
  absent: {
    label: '결석',
    tone: 'bg-rose-50 text-rose-700',
    button: 'border-rose-200 text-rose-700 hover:bg-rose-50',
    active: 'bg-rose-600 text-white border-rose-600',
  },
  late: {
    label: '지각',
    tone: 'bg-amber-50 text-amber-700',
    button: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    active: 'bg-amber-500 text-white border-amber-500',
  },
};

export function resolveDayStatus(
  record: AttendanceRecord | undefined,
  checkedInViaPin: boolean
): DayStatus {
  if (record?.status === 'present') return 'present';
  if (record?.status === 'late') return 'late';
  if (record?.status === 'absent') return 'absent';
  if (checkedInViaPin) return 'present';
  return 'unchecked';
}

export function toAttendanceStatus(status: Exclude<DayStatus, 'unchecked'>): AttendanceStatus {
  return status;
}

function syncDayCheckInSession(student: Student, date: string): void {
  const sessions = StorageService.getAttendanceSessions();
  const existing = sessions.find((s) => s.sessionDate === date && s.customerId === student.id);
  const now = new Date().toISOString();
  StorageService.saveAttendanceSession({
    id: existing?.id || `att-sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerId: student.id,
    customerName: student.name,
    sessionDate: date,
    checkInAt: existing?.checkInAt || now,
    checkInMethod: existing?.checkInMethod || 'manual',
    memo: existing?.memo,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  });
}

export type PersistDayAttendanceResult =
  | { ok: true }
  | { ok: false; warning: string };

/** day attendance(DAY_ATTENDANCE) 기록 저장 — 등원/지각/결석 공통 */
export function persistDayAttendance(params: {
  student: Student;
  date: string;
  status: Exclude<DayStatus, 'unchecked'>;
  createdBy: string;
  existing?: AttendanceRecord | null;
  memo?: string;
}): PersistDayAttendanceResult {
  const { student, date, status, createdBy, memo } = params;
  const existing =
    params.existing ??
    StorageService.getAttendance().find(
      (r) =>
        r.date === date &&
        r.studentId === student.id &&
        r.classId === DAY_ATTENDANCE_CLASS_ID
    );

  const nextStatus = toAttendanceStatus(status);
  const passResult = applySessionPassForAttendance({
    student,
    nextStatus,
    previous: existing || null,
    date,
  });
  if (passResult.warning) {
    return { ok: false, warning: passResult.warning };
  }

  StorageService.saveAttendanceRecord({
    ...(existing ? { id: existing.id } : {}),
    date,
    studentId: student.id,
    studentName: student.name,
    classId: DAY_ATTENDANCE_CLASS_ID,
    className: DAY_ATTENDANCE_CLASS_NAME,
    status: nextStatus,
    absentReason: status === 'absent' ? memo?.trim() || undefined : undefined,
    memo: memo?.trim() || undefined,
    createdBy,
    sessionPassId: passResult.sessionPassId,
  });

  if (status === 'present' || status === 'late') {
    syncDayCheckInSession(student, date);
  }

  return { ok: true };
}

/** 원장 홈 등원 1탭용 */
export function markDayPresent(params: {
  student: Student;
  date: string;
  createdBy: string;
  existing?: AttendanceRecord | null;
}): PersistDayAttendanceResult {
  return persistDayAttendance({
    ...params,
    status: 'present',
  });
}
