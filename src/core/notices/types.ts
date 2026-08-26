import type { ModuleLabels } from '@/core/labels';
import type { NotificationType } from '@/types';

/** 가정통신문·안내장으로 쓰는 알림 유형 */
export type ParentNoticeKind = Extract<NotificationType, 'notice' | 'announcement'>;

export type NoticeTargetMode = 'all' | 'class' | 'student';

export const PARENT_NOTICE_KIND_LABEL: Record<ParentNoticeKind, string> = {
  notice: '가정통신문',
  announcement: '안내장',
};

/** 업종 라벨 기준 대상 표시 */
export function getNoticeTargetModeLabel(
  mode: NoticeTargetMode,
  labels: ModuleLabels
): string {
  if (mode === 'all') return `전체 ${labels.contact.singular}`;
  if (mode === 'class') return `특정 ${labels.service.singular}`;
  return `개별 ${labels.customer.singular}`;
}

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
  if (targetGroup.includes('전체')) return { mode: 'all' };
  return { mode: 'all' };
}

export function isParentNoticeType(type: NotificationType): type is ParentNoticeKind {
  return type === 'notice' || type === 'announcement';
}

/** accent.icon → soft badge / edit button (Tailwind 정적 클래스) */
export function noticeAccentClasses(iconClass: string): {
  soft: string;
  softHover: string;
  edit: string;
  active: string;
} {
  if (iconClass.includes('teal')) {
    return {
      soft: 'bg-teal-50 text-teal-700',
      softHover: 'hover:border-teal-200 hover:bg-teal-50/50',
      edit: 'text-teal-700 hover:bg-teal-50',
      active: 'bg-teal-600 text-white',
    };
  }
  if (iconClass.includes('orange')) {
    return {
      soft: 'bg-orange-50 text-orange-700',
      softHover: 'hover:border-orange-200 hover:bg-orange-50/50',
      edit: 'text-orange-700 hover:bg-orange-50',
      active: 'bg-orange-600 text-white',
    };
  }
  if (iconClass.includes('sky')) {
    return {
      soft: 'bg-sky-50 text-sky-700',
      softHover: 'hover:border-sky-200 hover:bg-sky-50/50',
      edit: 'text-sky-700 hover:bg-sky-50',
      active: 'bg-sky-600 text-white',
    };
  }
  return {
    soft: 'bg-indigo-50 text-indigo-700',
    softHover: 'hover:border-indigo-200 hover:bg-indigo-50/50',
    edit: 'text-indigo-700 hover:bg-indigo-50',
    active: 'bg-indigo-600 text-white',
  };
}
