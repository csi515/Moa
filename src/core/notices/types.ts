import type { NotificationType } from '@/types';

/** 가정통신문·안내장으로 쓰는 알림 유형 */
export type ParentNoticeKind = Extract<NotificationType, 'notice' | 'announcement'>;

export type NoticeTargetMode = 'all' | 'class' | 'student';

export const PARENT_NOTICE_KIND_LABEL: Record<ParentNoticeKind, string> = {
  notice: '가정통신문',
  announcement: '안내장',
};

export const NOTICE_TARGET_MODE_LABEL: Record<NoticeTargetMode, string> = {
  all: '전체 보호자',
  class: '특정 반',
  student: '개별 원아',
};

/** targetGroup 인코딩 — class:{id} / student:{id} / all */
export function encodeNoticeTarget(mode: NoticeTargetMode, id?: string): string {
  if (mode === 'all') return 'all';
  if (mode === 'class' && id) return `class:${id}`;
  if (mode === 'student' && id) return `student:${id}`;
  return 'all';
}

export function parseNoticeTarget(targetGroup?: string): {
  mode: NoticeTargetMode;
  id?: string;
} {
  if (!targetGroup || targetGroup === 'all') return { mode: 'all' };
  if (targetGroup.startsWith('class:')) {
    return { mode: 'class', id: targetGroup.slice('class:'.length) };
  }
  if (targetGroup.startsWith('student:')) {
    return { mode: 'student', id: targetGroup.slice('student:'.length) };
  }
  // 레거시 한글 라벨 호환
  if (targetGroup.includes('전체')) return { mode: 'all' };
  return { mode: 'all' };
}

export function isParentNoticeType(type: NotificationType): type is ParentNoticeKind {
  return type === 'notice' || type === 'announcement';
}
