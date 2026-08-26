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
import type { SyncCache } from './coreEntitySync';
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
import { diffIds } from './utils';

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

  logErrors({
    curriculumLevels: levelsResult.error,
    curriculumItems: itemsResult.error,
    curriculumProgress: progressResult.error,
    weeklyAssignments: assignmentsResult.error,
    assignmentItems: assignmentItemsResult.error,
    achievements: achievementsResult.error,
    learningReports: reportsResult.error,
  });

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
  cache: SyncCache
): Promise<void> {
  if (!PIANO_SYNC_KEYS.has(key) || !EDUCATION_KEYS.has(key)) return;

  switch (key) {
    case STORAGE_KEYS.CURRICULUM_LEVELS:
      return persistEducationTable(
        'curriculum_levels',
        organizationId,
        cache,
        STORAGE_KEYS.CURRICULUM_LEVELS,
        (items) => (items as CurriculumLevel[]).map((l) => curriculumLevelToRow(l, organizationId))
      );
    case STORAGE_KEYS.CURRICULUM_ITEMS:
      return persistEducationTable(
        'curriculum_items',
        organizationId,
        cache,
        STORAGE_KEYS.CURRICULUM_ITEMS,
        (items) => (items as CurriculumItem[]).map((i) => curriculumItemToRow(i, organizationId))
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
          )
      );
    case STORAGE_KEYS.WEEKLY_ASSIGNMENTS:
      return persistWeeklyAssignments(organizationId, cache);
    case STORAGE_KEYS.ACHIEVEMENTS:
      return persistEducationTable(
        'achievements',
        organizationId,
        cache,
        STORAGE_KEYS.ACHIEVEMENTS,
        (items) => (items as Achievement[]).map((a) => achievementToRow(a, organizationId))
      );
    case STORAGE_KEYS.LEARNING_REPORTS:
      return persistEducationTable(
        'learning_reports',
        organizationId,
        cache,
        STORAGE_KEYS.LEARNING_REPORTS,
        (items) => (items as LearningReport[]).map((r) => learningReportToRow(r, organizationId))
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
  toRows: (items: unknown[]) => T[]
): Promise<void> {
  const client = getPianoClient();
  const items = cache.get<unknown[]>(storageKey) || [];
  const rows = toRows(items);

  const { data: existing, error } = await client
    .from(table)
    .select('id')
    .eq('organization_id', orgId);

  if (error) {
    console.error(`Failed to fetch piano.${table}:`, error);
    return;
  }

  const toDelete = diffIds(
    (existing || []).map((r) => r.id),
    rows.map((r) => r.id)
  );
  if (toDelete.length > 0) {
    const { error: deleteError } = await client.from(table).delete().in('id', toDelete);
    if (deleteError) console.error(`Failed to delete from piano.${table}:`, deleteError);
  }

  for (const row of rows) {
    const { error: upsertError } = await client.from(table).upsert(row as never);
    if (upsertError) console.error(`Failed to upsert piano.${table}:`, upsertError);
  }

  writeLocal(storageKey, items);
}

async function persistWeeklyAssignments(orgId: string, cache: SyncCache): Promise<void> {
  const client = getPianoClient();
  const assignments = cache.get<WeeklyAssignment[]>(STORAGE_KEYS.WEEKLY_ASSIGNMENTS) || [];

  const { data: existingAssignments, error: fetchError } = await client
    .from('weekly_assignments')
    .select('id')
    .eq('organization_id', orgId);

  if (fetchError) {
    console.error('Failed to fetch weekly_assignments:', fetchError);
    return;
  }

  const currentIds = assignments.map((a) => a.id);
  const toDeleteAssignments = diffIds(
    (existingAssignments || []).map((r) => r.id),
    currentIds
  );
  if (toDeleteAssignments.length > 0) {
    const { error } = await client
      .from('weekly_assignments')
      .delete()
      .in('id', toDeleteAssignments);
    if (error) console.error('Failed to delete weekly_assignments:', error);
  }

  for (const assignment of assignments) {
    const { error } = await client
      .from('weekly_assignments')
      .upsert(weeklyAssignmentToRow(assignment, orgId));
    if (error) console.error('Failed to upsert weekly_assignment:', error);
  }

  const allItems = assignments.flatMap((a) =>
    a.items.map((item) => assignmentItemToRow({ ...item, assignmentId: a.id }, orgId))
  );

  const { data: existingItems, error: itemsFetchError } = await client
    .from('assignment_items')
    .select('id')
    .eq('organization_id', orgId);

  if (itemsFetchError) {
    console.error('Failed to fetch assignment_items:', itemsFetchError);
    return;
  }

  const toDeleteItems = diffIds(
    (existingItems || []).map((r) => r.id),
    allItems.map((r) => r.id)
  );
  if (toDeleteItems.length > 0) {
    const { error } = await client.from('assignment_items').delete().in('id', toDeleteItems);
    if (error) console.error('Failed to delete assignment_items:', error);
  }

  for (const row of allItems) {
    const { error } = await client.from('assignment_items').upsert(row);
    if (error) console.error('Failed to upsert assignment_item:', error);
  }

  writeLocal(STORAGE_KEYS.WEEKLY_ASSIGNMENTS, assignments);
}

function logErrors(errors: Record<string, unknown>): void {
  for (const [key, err] of Object.entries(errors)) {
    if (err) console.error(`Failed to load ${key}:`, err);
  }
}
