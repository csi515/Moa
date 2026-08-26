import type { AppNotification, Student } from '@/types';
import { isParentNoticeType } from './types';
import { parseNoticeTarget } from './noticeTarget';

/** 가정통신문·안내장만 추림 */
export function filterParentNotices(list: AppNotification[]): AppNotification[] {
  return list.filter((n) => isParentNoticeType(n.type));
}

/** 학부모 포털 — 해당 원아/회원에게 보이는 게시된 안내 */
export function getNoticesForStudent(
  list: AppNotification[],
  student: Student
): AppNotification[] {
  return filterParentNotices(list)
    .filter((n) => n.status === 'sent')
    .filter((n) => {
      const { mode, id } = parseNoticeTarget(n.targetGroup);
      if (mode === 'all') return true;
      if (mode === 'student') {
        return (id || n.targetStudentId) === student.id;
      }
      if (mode === 'class' && id) {
        return (student.classIds || []).includes(id);
      }
      if (n.targetStudentId) return n.targetStudentId === student.id;
      return true;
    })
    .sort((a, b) => (b.sentAt || b.createdAt || '').localeCompare(a.sentAt || a.createdAt || ''));
}

/** 발송 대상 목록 */
export function resolveNoticeRecipients(
  students: Student[],
  mode: 'all' | 'class' | 'student',
  targetId?: string
): Student[] {
  const active = students.filter((s) => s.status === 'active');
  if (mode === 'all') return active;
  if (mode === 'class' && targetId) {
    return active.filter((s) => (s.classIds || []).includes(targetId));
  }
  if (mode === 'student' && targetId) {
    return active.filter((s) => s.id === targetId);
  }
  return [];
}
