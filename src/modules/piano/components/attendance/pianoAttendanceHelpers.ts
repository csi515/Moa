import type { AttendanceRecord, AttendanceStatus } from '@/types';
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
