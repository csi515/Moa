import type {
  Student,
  TextbookPayment,
} from '../../../types';
import { getPianoClient } from '../../../lib/supabase/pianoClient';
import { writeLocal } from '../localStorageEngine';
import { STORAGE_KEYS, type StorageKey } from '../storageKeys';
import type { PersistAbortGuard, SyncCache } from './syncTypes';
import {
  paymentToPianoRow,
  studentToPianoCustomerRow,
} from './pianoEntityMappers';
import {
  requireCacheList,
  upsertThenDiffDelete,
  upsertThenDiffDeleteByKeys,
} from './persistHelpers';

function classMemberKey(serviceId: string, customerId: string): string {
  return `${serviceId}:${customerId}`;
}

export async function persistPianoCustomers(
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const students = requireCacheList<Student>(cache, STORAGE_KEYS.STUDENTS, 'piano.customers');
  if (!students) return;

  const client = getPianoClient();

  await upsertThenDiffDelete({
    context: 'piano.customers',
    cachePresent: true,
    currentIds: students.map((s) => s.id),
    isAborted,
    upsertAll: async () => {
      for (const student of students) {
        if (isAborted()) return;
        const { error } = await client
          .from('customers')
          .upsert(studentToPianoCustomerRow(student, orgId));
        if (error) console.error('Failed to upsert piano customer:', error);
      }
    },
    fetchRemoteIds: async () => {
      const { data: existing, error } = await client
        .from('customers')
        .select('customer_id')
        .eq('organization_id', orgId);
      return { ids: (existing || []).map((r) => r.customer_id), error };
    },
    deleteIds: async (ids) => {
      const { error } = await client.from('customers').delete().in('customer_id', ids);
      return { error };
    },
  });
  if (isAborted()) return;

  // class_members: keyed diff (조직 단위 wipe 금지)
  const memberRows = students.flatMap((s) =>
    (s.classIds || []).map((classId) => ({
      organization_id: orgId,
      service_id: classId,
      customer_id: s.id,
    }))
  );
  const currentMemberKeys = memberRows.map((r) => classMemberKey(r.service_id, r.customer_id));

  await upsertThenDiffDeleteByKeys({
    context: 'piano.class_members',
    cachePresent: true,
    currentKeys: currentMemberKeys,
    isAborted,
    upsertAll: async () => {
      for (const row of memberRows) {
        if (isAborted()) return;
        const { error } = await client.from('class_members').upsert(row, {
          onConflict: 'service_id,customer_id',
        });
        if (error) console.error('Failed to upsert class member:', error);
      }
    },
    fetchRemoteKeys: async () => {
      const { data: existingMembers, error } = await client
        .from('class_members')
        .select('service_id, customer_id')
        .eq('organization_id', orgId);
      return {
        keys: (existingMembers || []).map((r) => classMemberKey(r.service_id, r.customer_id)),
        error,
      };
    },
    deleteKey: async (key) => {
      const [serviceId, customerId] = key.split(':');
      if (!serviceId || !customerId) return { error: null };
      const { error } = await client
        .from('class_members')
        .delete()
        .eq('organization_id', orgId)
        .eq('service_id', serviceId)
        .eq('customer_id', customerId);
      return { error };
    },
  });

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.STUDENTS, students);
}

export async function persistPianoPayments(
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const payments = requireCacheList<TextbookPayment>(
    cache,
    STORAGE_KEYS.TEXTBOOK_PAYMENTS,
    'textbook_payments'
  );
  if (!payments) return;

  const client = getPianoClient();

  await upsertThenDiffDelete({
    context: 'piano.textbook_payments',
    cachePresent: true,
    currentIds: payments.map((p) => p.id),
    isAborted,
    upsertAll: async () => {
      for (const payment of payments) {
        if (isAborted()) return;
        const { error: upsertError } = await client
          .from('textbook_payments')
          .upsert(paymentToPianoRow(payment, orgId));
        if (upsertError) console.error('Failed to upsert textbook payment:', upsertError);
      }
    },
    fetchRemoteIds: async () => {
      const { data: existing, error } = await client
        .from('textbook_payments')
        .select('id')
        .eq('organization_id', orgId);
      return { ids: (existing || []).map((r) => r.id), error };
    },
    deleteIds: async (ids) => {
      const { error } = await client.from('textbook_payments').delete().in('id', ids);
      return { error };
    },
  });

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.TEXTBOOK_PAYMENTS, payments);
}

export async function persistPianoTable<T extends { id: string }>(
  table:
    | 'attendance'
    | 'lesson_records'
    | 'practice_records'
    | 'textbooks'
    | 'textbook_sales'
    | 'textbook_inventory_transactions'
    | 'songs'
    | 'expenses'
    | 'events'
    | 'performance_videos',
  orgId: string,
  cache: SyncCache,
  storageKey: StorageKey,
  toRows: (items: unknown[]) => T[],
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const items = requireCacheList<unknown>(cache, storageKey, `piano.${table}`);
  if (!items) return;

  const client = getPianoClient();
  const rows = toRows(items);

  await upsertThenDiffDelete({
    context: `piano.${table}`,
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
