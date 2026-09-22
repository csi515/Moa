import { sessionPassService } from '@/core/schedules/sessionPassService';
import { isSessionPassBillingStudent } from '@/core/academy/utils/billingMode';
import type { AttendanceRecord, AttendanceStatus, Student } from '@/types';
import { StorageService } from '@/services/storage';

const COUNTABLE: AttendanceStatus[] = ['present', 'late', 'early_leave', 'make_up'];

function countsTowardPass(status: AttendanceStatus): boolean {
  return COUNTABLE.includes(status);
}

/**
 * 회차권 학생 출결 저장 시 이용권 차감/복구.
 * 이용권 규칙은 sessionPassService에 위임 (출결 도메인 리팩터 범위 밖 — 호출부만 정렬).
 */
export function applySessionPassForAttendance(params: {
  student: Student;
  nextStatus: AttendanceStatus;
  previous?: Pick<AttendanceRecord, 'id' | 'status' | 'sessionPassId'> | null;
  /** YYYY-MM-DD — 등원(c-default)과 레슨 출결 이중 차감 방지용 */
  date: string;
}): { sessionPassId?: string; warning?: string } {
  if (!isSessionPassBillingStudent(params.student)) {
    return { sessionPassId: undefined };
  }

  const prevCounted = params.previous ? countsTowardPass(params.previous.status) : false;
  const nextCounted = countsTowardPass(params.nextStatus);
  let sessionPassId = params.previous?.sessionPassId;
  const excludeId = params.previous?.id;

  if (!prevCounted && nextCounted) {
    const sibling = StorageService.getAttendance().find(
      (r) =>
        r.studentId === params.student.id &&
        r.date === params.date &&
        r.id !== excludeId &&
        countsTowardPass(r.status) &&
        Boolean(r.sessionPassId)
    );
    if (sibling?.sessionPassId) {
      sessionPassId = sibling.sessionPassId;
    } else {
      const consumed = sessionPassService.consume(params.student.id);
      if (!consumed) {
        return {
          sessionPassId: undefined,
          warning: `${params.student.name} 학생의 회차권이 없거나 잔여 횟수가 없습니다.`,
        };
      }
      sessionPassId = consumed;
    }
  } else if (prevCounted && !nextCounted && sessionPassId) {
    const stillUsedElsewhere = StorageService.getAttendance().some(
      (r) =>
        r.studentId === params.student.id &&
        r.date === params.date &&
        r.id !== excludeId &&
        countsTowardPass(r.status) &&
        r.sessionPassId === sessionPassId
    );
    if (!stillUsedElsewhere) {
      sessionPassService.refund(sessionPassId);
    }
    sessionPassId = undefined;
  }

  return { sessionPassId };
}
