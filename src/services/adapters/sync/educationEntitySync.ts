import type {
  Achievement,
  CurriculumItem,
  CurriculumLevel,
  LearningReport,
  StudentCurriculumProgress,
  WeeklyAssignment,
} from '@/types/education';
import { getPianoClient } from '@/lib/supabase/pianoClient';
import { writeLocal } from '../localStorageEngine';
import { PIANO_SYNC_KEYS, STORAGE_KEYS, type StorageKey } from '../storageKeys';
import type { PersistAbortGuard, SyncCache } from './syncTypes';
import {
  achievementToRow,
  assignmentItemToRow,
  curriculumItemToRow,
  curriculumLevelToRow,
  curriculumProgressToRow,
  learningReportToRow,
  rowToAchievement,
  rowToCurriculumItem,
  rowToCurriculumLevel,
  rowToCurriculumProgress,
  rowToLearningReport,
  rowToWeeklyAssignment,
  weeklyAssignmentToRow,
} from './educationEntityMappers';
import {
  checkHydrateErrors,
  requireCacheList,
  upsertThenDiffDelete,
} from './persistHelpers';

const EDUCATION_KEYS = new Set<StorageKey>([
  STORAGE_KEYS.CURRICULUM_LEVELS,
  STORAGE_KEYS.CURRICULUM_ITEMS,
  STORAGE_KEYS.CURRICULUM_PROGRESS,
  STORAGE_KEYS.WEEKLY_ASSIGNMENTS,
  STORAGE_KEYS.ACHIEVEMENTS,
  STORAGE_KEYS.LEARNING_REPORTS,
]);

/** Piano 교육(커리큘럼·과제·리포트) hydrate */
export async function hydrateEducationEntities(
  organizationId: string,
  cache: SyncCache
): Promise<void> {
  const client = getPianoClient();

  const [
    levelsResult,
    itemsResult,
    progressResult,
    assignmentsResult,
    assignmentItemsResult,
    achievementsResult,
    reportsResult,
  ] = await Promise.all([
    client.from('curriculum_levels').select('*').eq('organization_id', organizationId),
    client.from('curriculum_items').select('*').eq('organization_id', organizationId),
    client.from('student_curriculum_progress').select('*').eq('organization_id', organizationId),
    client.from('weekly_assignments').select('*').eq('organization_id', organizationId),
    client.from('assignment_items').select('*').eq('organization_id', organizationId),
    client.from('achievements').select('*').eq('organization_id', organizationId),
    client.from('learning_reports').select('*').eq('organization_id', organizationId),
  ]);

  checkHydrateErrors(
    {
      curriculumLevels: levelsResult.error,
      curriculumItems: itemsResult.error,
      curriculumProgress: progressResult.error,
      weeklyAssignments: assignmentsResult.error,
      assignmentItems: assignmentItemsResult.error,
      achievements: achievementsResult.error,
      learningReports: reportsResult.error,
    },
    'education'
  );

  const itemsByAssignment = new Map<string, typeof assignmentItemsResult.data>();
  for (const item of assignmentItemsResult.data || []) {
    const list = itemsByAssignment.get(item.assignment_id) || [];
    list.push(item);
    itemsByAssignment.set(item.assignment_id, list);
  }

  const assignments = (assignmentsResult.data || []).map((row) =>
    rowToWeeklyAssignment(row, itemsByAssignment.get(row.id) || [])
  );

  const entities: [StorageKey, unknown][] = [
    [STORAGE_KEYS.CURRICULUM_LEVELS, (levelsResult.data || []).map(rowToCurriculumLevel)],
    [STORAGE_KEYS.CURRICULUM_ITEMS, (itemsResult.data || []).map(rowToCurriculumItem)],
    [STORAGE_KEYS.CURRICULUM_PROGRESS, (progressResult.data || []).map(rowToCurriculumProgress)],
    [STORAGE_KEYS.WEEKLY_ASSIGNMENTS, assignments],
    [STORAGE_KEYS.ACHIEVEMENTS, (achievementsResult.data || []).map(rowToAchievement)],
    [STORAGE_KEYS.LEARNING_REPORTS, (reportsResult.data || []).map(rowToLearningReport)],
  ];

  for (const [key, value] of entities) {
    cache.set(key, value);
    writeLocal(key, value);
  }
}

/** Piano 교육 엔티티 persist */
export async function persistEducationEntity(
  key: StorageKey,
  organizationId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard = () => false
): Promise<void> {
  if (!PIANO_SYNC_KEYS.has(key) || !EDUCATION_KEYS.has(key) || isAborted()) return;

  switch (key) {
    case STORAGE_KEYS.CURRICULUM_LEVELS:
      return persistEducationTable(
        'curriculum_levels',
        organizationId,
        cache,
        STORAGE_KEYS.CURRICULUM_LEVELS,
        (items) => (items as CurriculumLevel[]).map((l) => curriculumLevelToRow(l, organizationId)),
        isAborted
      );
    case STORAGE_KEYS.CURRICULUM_ITEMS:
      return persistEducationTable(
        'curriculum_items',
        organizationId,
        cache,
        STORAGE_KEYS.CURRICULUM_ITEMS,
        (items) => (items as CurriculumItem[]).map((i) => curriculumItemToRow(i, organizationId)),
        isAborted
      );
    case STORAGE_KEYS.CURRICULUM_PROGRESS:
      return persistEducationTable(
        'student_curriculum_progress',
        organizationId,
        cache,
        STORAGE_KEYS.CURRICULUM_PROGRESS,
        (items) =>
          (items as StudentCurriculumProgress[]).map((p) =>
            curriculumProgressToRow(p, organizationId)
          ),
        isAborted
      );
    case STORAGE_KEYS.WEEKLY_ASSIGNMENTS:
      return persistWeeklyAssignments(organizationId, cache, isAborted);
    case STORAGE_KEYS.ACHIEVEMENTS:
      return persistEducationTable(
        'achievements',
        organizationId,
        cache,
        STORAGE_KEYS.ACHIEVEMENTS,
        (items) => (items as Achievement[]).map((a) => achievementToRow(a, organizationId)),
        isAborted
      );
    case STORAGE_KEYS.LEARNING_REPORTS:
      return persistEducationTable(
        'learning_reports',
        organizationId,
        cache,
        STORAGE_KEYS.LEARNING_REPORTS,
        (items) => (items as LearningReport[]).map((r) => learningReportToRow(r, organizationId)),
        isAborted
      );
    default:
      return;
  }
}

async function persistEducationTable<T extends { id: string }>(
  table:
    | 'curriculum_levels'
    | 'curriculum_items'
    | 'student_curriculum_progress'
    | 'achievements'
    | 'learning_reports',
  orgId: string,
  cache: SyncCache,
  storageKey: StorageKey,
  toRows: (items: unknown[]) => T[],
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const items = requireCacheList<unknown>(cache, storageKey, `education.${table}`);
  if (!items) return;

  const client = getPianoClient();
  const rows = toRows(items);

  await upsertThenDiffDelete({
    context: `education.${table}`,
    cachePresent: true,
    currentIds: rows.map((r) => r.id),
    isAborted,
    upsertAll: async () => {
      for (const row of rows) {
        if (isAborted()) return;
        const { error: upsertError } = await client.from(table).upsert(row as never);
        if (upsertError) console.error(`Failed to upsert piano.${table}:`, upsertError);
      }
    },
    fetchRemoteIds: async () => {
      const { data: existing, error } = await client
        .from(table)
        .select('id')
        .eq('organization_id', orgId);
      return { ids: (existing || []).map((r) => r.id), error };
    },
    deleteIds: async (ids) => {
      const { error } = await client.from(table).delete().in('id', ids);
      return { error };
    },
  });

  if (isAborted()) return;
  writeLocal(storageKey, items);
}

async function persistWeeklyAssignments(
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const assignments = requireCacheList<WeeklyAssignment>(
    cache,
    STORAGE_KEYS.WEEKLY_ASSIGNMENTS,
    'weekly_assignments'
  );
  if (!assignments) return;

  const client = getPianoClient();

  // 과제 본문 sync 실패 시 assignment_items로 진행하지 않음 (기존 early-return 유지)
  const assignmentsOk = await upsertThenDiffDelete({
    context: 'education.weekly_assignments',
    cachePresent: true,
    currentIds: assignments.map((a) => a.id),
    isAborted,
    upsertAll: async () => {
      for (const assignment of assignments) {
        if (isAborted()) return;
        const { error } = await client
          .from('weekly_assignments')
          .upsert(weeklyAssignmentToRow(assignment, orgId));
        if (error) console.error('Failed to upsert weekly_assignment:', error);
      }
    },
    fetchRemoteIds: async () => {
      const { data: existingAssignments, error } = await client
        .from('weekly_assignments')
        .select('id')
        .eq('organization_id', orgId);
      return { ids: (existingAssignments || []).map((r) => r.id), error };
    },
    deleteIds: async (ids) => {
      const { error } = await client.from('weekly_assignments').delete().in('id', ids);
      return { error };
    },
  });
  if (!assignmentsOk || isAborted()) return;

  const allItems = assignments.flatMap((a) =>
    a.items.map((item) => assignmentItemToRow({ ...item, assignmentId: a.id }, orgId))
  );

  await upsertThenDiffDelete({
    context: 'education.assignment_items',
    cachePresent: true,
    currentIds: allItems.map((r) => r.id),
    isAborted,
    upsertAll: async () => {
      for (const row of allItems) {
        if (isAborted()) return;
        const { error } = await client.from('assignment_items').upsert(row);
        if (error) console.error('Failed to upsert assignment_item:', error);
      }
    },
    fetchRemoteIds: async () => {
      const { data: existingItems, error } = await client
        .from('assignment_items')
        .select('id')
        .eq('organization_id', orgId);
      return { ids: (existingItems || []).map((r) => r.id), error };
    },
    deleteIds: async (ids) => {
      const { error } = await client.from('assignment_items').delete().in('id', ids);
      return { error };
    },
  });

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.WEEKLY_ASSIGNMENTS, assignments);
}
