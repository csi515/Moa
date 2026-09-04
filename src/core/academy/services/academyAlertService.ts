import { createNotificationsStorage } from '@/services/storage/notificationsStorage';
import type { MakeupItem, NotificationType } from '@/types';

const notifications = createNotificationsStorage();

function publishParentAlert(params: {
  type: Extract<NotificationType, 'absence' | 'makeup' | 'tuition_unpaid'>;
  title: string;
  message: string;
  student: {
    id: string;
    name: string;
    parentPhone?: string;
  };
  scheduledDate?: string;
}): void {
  notifications.saveNotification({
    type: params.type,
    title: params.title,
    message: params.message,
    targetStudentId: params.student.id,
    targetStudentName: params.student.name,
    targetParentPhone: params.student.parentPhone,
    targetGroup: `student:${params.student.id}`,
    recipientCount: 1,
    scheduledDate: params.scheduledDate,
    status: 'sent',
    sentAt: new Date().toISOString(),
  });
}

/** 결석 시 학부모 포털 알림 */
export function notifyParentAbsence(params: {
  studentId: string;
  studentName: string;
  parentPhone?: string;
  className: string;
  date: string;
  reason?: string;
}): void {
  const reason = params.reason ? ` (${params.reason})` : '';
  publishParentAlert({
    type: 'absence',
    title: '결석 안내',
    message: `${params.studentName} 원생이 ${params.date} ${params.className} 수업에 결석 처리되었습니다.${reason}`,
    student: {
      id: params.studentId,
      name: params.studentName,
      parentPhone: params.parentPhone,
    },
    scheduledDate: params.date,
  });
}

/** 보강 일정 등록 시 학부모 포털 알림 */
export function notifyParentMakeupScheduled(item: MakeupItem): void {
  if (!item.makeUpDate) return;
  const slot =
    item.makeUpStartTime && item.makeUpEndTime
      ? ` ${item.makeUpStartTime}–${item.makeUpEndTime}`
      : '';
  const room = item.makeUpRoom ? ` · ${item.makeUpRoom}` : '';
  const teacher = item.makeUpTeacherName ? ` · ${item.makeUpTeacherName}` : '';

  publishParentAlert({
    type: 'makeup',
    title: '보강 일정 안내',
    message: `${item.studentName} 원생 보강이 ${item.makeUpDate}${slot}${room}${teacher}에 예약되었습니다. (결석일 ${item.originalDate})`,
    student: {
      id: item.studentId,
      name: item.studentName,
      parentPhone: item.parentPhone,
    },
    scheduledDate: item.makeUpDate,
  });
}

/** 미납 청구 시 학부모 포털 알림 */
export function notifyParentTuitionUnpaid(params: {
  studentId: string;
  studentName: string;
  parentPhone?: string;
  yearMonth: string;
  amount: number;
  dueDate: string;
}): void {
  publishParentAlert({
    type: 'tuition_unpaid',
    title: '수강료 미납 안내',
    message: `${params.studentName} 원생 ${params.yearMonth} 수강료 ₩${params.amount.toLocaleString()}원이 미납입니다. (납기 ${params.dueDate})`,
    student: {
      id: params.studentId,
      name: params.studentName,
      parentPhone: params.parentPhone,
    },
    scheduledDate: params.dueDate,
  });
}
