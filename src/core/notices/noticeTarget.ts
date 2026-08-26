import type { NoticeTargetMode } from './types';

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
