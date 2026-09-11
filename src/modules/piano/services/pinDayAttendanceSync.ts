import { StorageService } from '@/services/storage';
import { applySessionPassForAttendance } from './lessonPassConsume';
import {
  DAY_ATTENDANCE_CLASS_ID,
  DAY_ATTENDANCE_CLASS_NAME,
} from '@/core/attendance/dayAttendance';
import { todayIsoLocal } from '@/shared/utils/localDate';

/**
 * PIN 체크인 성공 시 등원(c-default) AttendanceRecord를 동기화.
 * 회차권은 학생·일 기준 1회 정책(applySessionPassForAttendance)을 따른다.
 */
export function syncDayAttendanceFromPinCheckIn(customerId: string): {
  warning?: string;
} {
  const student = StorageService.getStudents().find((s) => s.id === customerId);
  if (!student) return {};

  const date = todayIsoLocal();
  const existing = StorageService.getAttendance().find(
    (r) =>
      r.date === date &&
      r.studentId === customerId &&
      r.classId === DAY_ATTENDANCE_CLASS_ID
  );

  if (existing && (existing.status === 'present' || existing.status === 'late')) {
    return {};
  }

  const passResult = applySessionPassForAttendance({
    student,
    nextStatus: 'present',
    previous: existing || null,
    date,
  });

  StorageService.saveAttendanceRecord({
    ...(existing ? { id: existing.id } : {}),
    date,
    studentId: student.id,
    studentName: student.name,
    classId: DAY_ATTENDANCE_CLASS_ID,
    className: DAY_ATTENDANCE_CLASS_NAME,
    status: 'present',
    createdBy: 'PIN',
    sessionPassId: passResult.sessionPassId,
  });

  return { warning: passResult.warning };
}
