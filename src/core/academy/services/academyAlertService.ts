import { createNotificationsStorage } from '@/services/storage/notificationsStorage';
import { getOrganizationId } from '@/services/adapters/storageContext';
import { dispatchAppPush } from '@/core/push';
import type { MakeupItem, NotificationType } from '@/types';

const notifications = createNotificationsStorage();

function publishParentAlert(params: {
  type: Extract<NotificationType, 'absence' | 'makeup' | 'tuition_unpaid' | 'practice'>;
  title: string;
  message: string;
  student: {
    id: string;
    name: string;
    parentPhone?: string;
  };
  scheduledDate?: string;
  portalTab?: string;
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

  const organizationId = getOrganizationId() || undefined;
  void dispatchAppPush({
    title: params.title,
    body: params.message,
    organizationId,
    studentId: params.student.id,
    portalTab: params.portalTab || 'notices',
    type: params.type,
  });
}

/** 결석 시 학부모 포털 알림 + 앱 푸시 */
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
    portalTab: 'attendance',
  });
}

/** 보강 일정 등록 시 학부모 포털 알림 + 앱 푸시 */
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
    portalTab: 'attendance',
  });
}

/** 미납 청구 시 학부모 포털 알림 + 앱 푸시 */
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
    portalTab: 'tuition',
  });
}

/** 가정 연습 일지 스태프 확인 시 학부모 알림 + 앱 푸시 */
export function notifyParentPracticeReviewed(params: {
  studentId: string;
  studentName: string;
  parentPhone?: string;
  date: string;
  songTitle: string;
}): void {
  publishParentAlert({
    type: 'practice',
    title: '연습 일지 확인',
    message: `${params.studentName} 원생 ${params.date} 「${params.songTitle}」 연습 일지를 선생님이 확인했습니다.`,
    student: {
      id: params.studentId,
      name: params.studentName,
      parentPhone: params.parentPhone,
    },
    scheduledDate: params.date,
    portalTab: 'progress',
  });
}
