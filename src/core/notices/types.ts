/** 가정통신문·안내장으로 쓰는 알림 유형 */
import type { NotificationType } from '@/types';

export type ParentNoticeKind = Extract<NotificationType, 'notice' | 'announcement'>;

export type NoticeTargetMode = 'all' | 'class' | 'student';

export const PARENT_NOTICE_KIND_LABEL: Record<ParentNoticeKind, string> = {
  notice: '가정통신문',
  announcement: '안내장',
};

export function isParentNoticeType(type: NotificationType): type is ParentNoticeKind {
  return type === 'notice' || type === 'announcement';
}
