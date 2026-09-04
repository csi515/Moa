import { StorageService } from '@/services/storage';
import type { AssignmentItem } from '@/types/education';

/**
 * 레슨 숙제를 이번 주 주간 과제에 반영합니다.
 * - 동일 곡명 항목이 있으면 instructions만 갱신
 * - 없으면 새 항목 추가
 * - homework가 비어 있으면 no-op
 */
export function syncLessonHomeworkToWeeklyAssignment(params: {
  studentId: string;
  songTitle: string;
  homework: string;
  staffId?: string | null;
}): void {
  const homework = params.homework.trim();
  if (!homework) return;

  const weekStart = StorageService.getCurrentWeekStart();
  const existing = StorageService.getWeeklyAssignments(params.studentId).find(
    (a) => a.weekStart === weekStart
  );
  const songTitle = params.songTitle.trim() || '레슨 과제';
  const items = [...(existing?.items || [])];
  const sameSongIdx = items.findIndex(
    (it) => it.songTitle.trim().toLowerCase() === songTitle.toLowerCase()
  );

  if (sameSongIdx >= 0) {
    items[sameSongIdx] = {
      ...items[sameSongIdx],
      instructions: homework,
      parentConfirmed: false,
      completed: false,
      parentConfirmedAt: undefined,
      completedAt: undefined,
    };
  } else {
    const newItem: AssignmentItem = {
      id: `ai-${Date.now()}`,
      assignmentId: existing?.id || '',
      songTitle,
      instructions: homework,
      sortOrder: items.length,
      parentConfirmed: false,
      completed: false,
    };
    items.push(newItem);
  }

  const saved = StorageService.saveWeeklyAssignment({
    ...(existing ? { id: existing.id } : {}),
    studentId: params.studentId,
    staffId: params.staffId || existing?.staffId,
    weekStart,
    title: existing?.title || `${weekStart} 주간 과제`,
    status: 'assigned',
    publishedAt: existing?.publishedAt || new Date().toISOString(),
    items: items.map((it) => ({
      ...it,
      assignmentId: existing?.id || it.assignmentId || '',
    })),
  });

  if (!existing) {
    StorageService.saveWeeklyAssignment({
      id: saved.id,
      studentId: saved.studentId,
      staffId: saved.staffId,
      weekStart: saved.weekStart,
      title: saved.title,
      status: saved.status,
      publishedAt: saved.publishedAt,
      items: saved.items.map((it) => ({ ...it, assignmentId: saved.id })),
    });
  }
}
