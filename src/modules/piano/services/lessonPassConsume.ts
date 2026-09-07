import { StorageService } from '@/services/storage';
import { isSessionPassBillingStudent } from '@/core/academy/utils/billingMode';
import type { AttendanceRecord, AttendanceStatus, Student } from '@/types';

const COUNTABLE: AttendanceStatus[] = ['present', 'late', 'early_leave', 'make_up'];

function countsTowardPass(status: AttendanceStatus): boolean {
  return COUNTABLE.includes(status);
}

/**
 * 회차권 원생 출결 저장 시 이용권 차감/복구.
 * - 차감 대상 상태로 전환: consume
 * - 차감 대상에서 벗어나면: refund
 */
export function applySessionPassForAttendance(params: {
  student: Student;
  nextStatus: AttendanceStatus;
  previous?: Pick<AttendanceRecord, 'status' | 'sessionPassId'> | null;
}): { sessionPassId?: string; warning?: string } {
  if (!isSessionPassBillingStudent(params.student)) {
    return { sessionPassId: undefined };
  }

  const prevCounted = params.previous ? countsTowardPass(params.previous.status) : false;
  const nextCounted = countsTowardPass(params.nextStatus);
  let sessionPassId = params.previous?.sessionPassId;

  if (!prevCounted && nextCounted) {
    const consumed = StorageService.consumeSessionPass(params.student.id);
    if (!consumed) {
      return {
        sessionPassId: undefined,
        warning: `${params.student.name} 원생의 회차권이 없거나 잔여 횟수가 없습니다.`,
      };
    }
    sessionPassId = consumed;
  } else if (prevCounted && !nextCounted && sessionPassId) {
    StorageService.refundSessionPass(sessionPassId);
    sessionPassId = undefined;
  }

  return { sessionPassId };
}
