import type {
  AttendanceRecord,
  LessonRecord,
  PracticeRecord,
  Song,
  Student,
  Textbook,
  TextbookInventoryTransaction,
  TextbookPayment,
  TextbookSale,
} from '../../../types';
import { getPianoClient } from '../../../lib/supabase/pianoClient';
import { writeLocal } from '../localStorageEngine';
import { PIANO_SYNC_KEYS, STORAGE_KEYS, type StorageKey } from '../storageKeys';
import type { SyncCache } from './coreEntitySync';
import {
  attendanceToPianoRow,
  inventoryToPianoRow,
  lessonToPianoRow,
  mergeStudentWithPiano,
  paymentToPianoRow,
  pianoRowToAttendance,
  pianoRowToInventory,
  pianoRowToLesson,
  pianoRowToPayment,
  pianoRowToPractice,
  pianoRowToSale,
  pianoRowToSong,
  pianoRowToTextbook,
  practiceToPianoRow,
  saleToPianoRow,
  songToPianoRow,
  studentToPianoCustomerRow,
  textbookToPianoRow,
} from './pianoEntityMappers';
import { diffIds } from './utils';

/** Piano 모듈 hydrate — Core hydrate 이후 호출 */
export async function hydratePianoEntities(
  organizationId: string,
  cache: SyncCache
): Promise<void> {
  const client = getPianoClient();

  const [
    pianoCustomersResult,
    classMembersResult,
    attendanceResult,
    lessonResult,
    practiceResult,
    textbooksResult,
    salesResult,
    paymentsResult,
    inventoryResult,
    songsResult,
  ] = await Promise.all([
    client.from('customers').select('*').eq('organization_id', organizationId),
    client.from('class_members').select('*').eq('organization_id', organizationId),
    client.from('attendance').select('*').eq('organization_id', organizationId),
    client.from('lesson_records').select('*').eq('organization_id', organizationId),
    client.from('practice_records').select('*').eq('organization_id', organizationId),
    client.from('textbooks').select('*').eq('organization_id', organizationId),
    client.from('textbook_sales').select('*').eq('organization_id', organizationId),
    client.from('textbook_payments').select('*').eq('organization_id', organizationId),
    client.from('textbook_inventory_transactions').select('*').eq('organization_id', organizationId),
    client.from('songs').select('*').eq('organization_id', organizationId),
  ]);

  logErrors({
    pianoCustomers: pianoCustomersResult.error,
    classMembers: classMembersResult.error,
    attendance: attendanceResult.error,
    lessonRecords: lessonResult.error,
    practiceRecords: practiceResult.error,
    textbooks: textbooksResult.error,
    sales: salesResult.error,
    payments: paymentsResult.error,
    inventory: inventoryResult.error,
    songs: songsResult.error,
  });

  // Merge piano.customers + class_members into students
  const teachers = cache.get<{ id: string; name: string }[]>(STORAGE_KEYS.TEACHERS) || [];
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));
  const pianoMap = new Map((pianoCustomersResult.data || []).map((p) => [p.customer_id, p]));

  const classIdsByCustomer = new Map<string, string[]>();
  for (const m of classMembersResult.data || []) {
    const list = classIdsByCustomer.get(m.customer_id) || [];
    list.push(m.service_id);
    classIdsByCustomer.set(m.customer_id, list);
  }

  const baseStudents = cache.get<Student[]>(STORAGE_KEYS.STUDENTS) || [];
  const mergedStudents = baseStudents.map((s) => {
    const pianoRow = pianoMap.get(s.id);
    const classIds = classIdsByCustomer.get(s.id) || s.classIds;
    if (!pianoRow) return { ...s, classIds };
    const teacherName = pianoRow.teacher_id ? teacherMap.get(pianoRow.teacher_id) : s.teacherName;
    return mergeStudentWithPiano(s, pianoRow, classIds, teacherName);
  });

  const entities: [StorageKey, unknown][] = [
    [STORAGE_KEYS.STUDENTS, mergedStudents],
    [STORAGE_KEYS.ATTENDANCE, (attendanceResult.data || []).map(pianoRowToAttendance)],
    [STORAGE_KEYS.LESSON_RECORDS, (lessonResult.data || []).map(pianoRowToLesson)],
    [STORAGE_KEYS.PRACTICE_RECORDS, (practiceResult.data || []).map(pianoRowToPractice)],
    [STORAGE_KEYS.TEXTBOOKS, (textbooksResult.data || []).map(pianoRowToTextbook)],
    [STORAGE_KEYS.TEXTBOOK_SALES, (salesResult.data || []).map(pianoRowToSale)],
    [STORAGE_KEYS.TEXTBOOK_PAYMENTS, (paymentsResult.data || []).map(pianoRowToPayment)],
    [
      STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS,
      (inventoryResult.data || []).map(pianoRowToInventory),
    ],
    [STORAGE_KEYS.SONGS, (songsResult.data || []).map(pianoRowToSong)],
  ];

  for (const [key, value] of entities) {
    cache.set(key, value);
    writeLocal(key, value);
  }
}

/** Piano 모듈 persist */
export async function persistPianoEntity(
  key: StorageKey,
  organizationId: string,
  cache: SyncCache
): Promise<void> {
  if (!PIANO_SYNC_KEYS.has(key)) return;

  switch (key) {
    case STORAGE_KEYS.STUDENTS:
      return persistPianoCustomers(organizationId, cache);
    case STORAGE_KEYS.ATTENDANCE:
      return persistPianoTable('attendance', organizationId, cache, STORAGE_KEYS.ATTENDANCE, (items) =>
        (items as AttendanceRecord[]).map((r) => attendanceToPianoRow(r, organizationId))
      );
    case STORAGE_KEYS.LESSON_RECORDS:
      return persistPianoTable('lesson_records', organizationId, cache, STORAGE_KEYS.LESSON_RECORDS, (items) =>
        (items as LessonRecord[]).map((r) => lessonToPianoRow(r, organizationId))
      );
    case STORAGE_KEYS.PRACTICE_RECORDS:
      return persistPianoTable('practice_records', organizationId, cache, STORAGE_KEYS.PRACTICE_RECORDS, (items) =>
        (items as PracticeRecord[]).map((r) => practiceToPianoRow(r, organizationId))
      );
    case STORAGE_KEYS.TEXTBOOKS:
      return persistPianoTable('textbooks', organizationId, cache, STORAGE_KEYS.TEXTBOOKS, (items) =>
        (items as Textbook[]).map((t) => textbookToPianoRow(t, organizationId))
      );
    case STORAGE_KEYS.TEXTBOOK_SALES:
      return persistPianoTable('textbook_sales', organizationId, cache, STORAGE_KEYS.TEXTBOOK_SALES, (items) =>
        (items as TextbookSale[]).map((s) => saleToPianoRow(s, organizationId))
      );
    case STORAGE_KEYS.TEXTBOOK_PAYMENTS:
      return persistPianoPayments(organizationId, cache);
    case STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS:
      return persistPianoTable(
        'textbook_inventory_transactions',
        organizationId,
        cache,
        STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS,
        (items) =>
          (items as TextbookInventoryTransaction[]).map((t) => inventoryToPianoRow(t, organizationId))
      );
    case STORAGE_KEYS.SONGS:
      return persistPianoTable('songs', organizationId, cache, STORAGE_KEYS.SONGS, (items) =>
        (items as Song[]).map((s) => songToPianoRow(s, organizationId))
      );
    default:
      return;
  }
}

async function persistPianoCustomers(orgId: string, cache: SyncCache): Promise<void> {
  const client = getPianoClient();
  const students = cache.get<Student[]>(STORAGE_KEYS.STUDENTS) || [];

  const { data: existing } = await client
    .from('customers')
    .select('customer_id')
    .eq('organization_id', orgId);

  const existingIds = (existing || []).map((r) => r.customer_id);
  const currentIds = students.map((s) => s.id);
  const toDelete = diffIds(existingIds, currentIds);

  if (toDelete.length > 0) {
    const { error } = await client.from('customers').delete().in('customer_id', toDelete);
    if (error) console.error('Failed to delete piano customers:', error);
  }

  for (const student of students) {
    const { error } = await client
      .from('customers')
      .upsert(studentToPianoCustomerRow(student, orgId));
    if (error) console.error('Failed to upsert piano customer:', error);
  }

  // Sync class_members
  const { error: deleteMembersError } = await client
    .from('class_members')
    .delete()
    .eq('organization_id', orgId);
  if (deleteMembersError) console.error('Failed to clear class members:', deleteMembersError);

  const memberRows = students.flatMap((s) =>
    (s.classIds || []).map((classId) => ({
      organization_id: orgId,
      service_id: classId,
      customer_id: s.id,
    }))
  );

  if (memberRows.length > 0) {
    const { error } = await client.from('class_members').upsert(memberRows);
    if (error) console.error('Failed to upsert class members:', error);
  }

  writeLocal(STORAGE_KEYS.STUDENTS, students);
}

async function persistPianoPayments(orgId: string, cache: SyncCache): Promise<void> {
  const client = getPianoClient();
  const payments = cache.get<TextbookPayment[]>(STORAGE_KEYS.TEXTBOOK_PAYMENTS) || [];

  const { data: existing, error } = await client
    .from('textbook_payments')
    .select('id')
    .eq('organization_id', orgId);

  if (error) {
    console.error('Failed to fetch textbook payments:', error);
    return;
  }

  const toDelete = diffIds(
    (existing || []).map((r) => r.id),
    payments.map((p) => p.id)
  );
  if (toDelete.length > 0) {
    const { error: deleteError } = await client.from('textbook_payments').delete().in('id', toDelete);
    if (deleteError) console.error('Failed to delete textbook payments:', deleteError);
  }

  for (const payment of payments) {
    const { error: upsertError } = await client
      .from('textbook_payments')
      .upsert(paymentToPianoRow(payment, orgId));
    if (upsertError) console.error('Failed to upsert textbook payment:', upsertError);
  }

  writeLocal(STORAGE_KEYS.TEXTBOOK_PAYMENTS, payments);
}

async function persistPianoTable<T extends { id: string }>(
  table:
    | 'attendance'
    | 'lesson_records'
    | 'practice_records'
    | 'textbooks'
    | 'textbook_sales'
    | 'textbook_inventory_transactions'
    | 'songs',
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

function logErrors(errors: Record<string, unknown>): void {
  for (const [key, err] of Object.entries(errors)) {
    if (err) console.error(`Failed to load ${key}:`, err);
  }
}
