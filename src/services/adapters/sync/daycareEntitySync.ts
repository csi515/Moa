import type { CareJournal, MedicationRequest } from '@/modules/daycare/care/types';
import { getCoreClient } from '@/lib/supabase';
import { writeLocal } from '../localStorageEngine';
import { DAYCARE_SYNC_KEYS, STORAGE_KEYS, type StorageKey } from '../storageKeys';
import type { SyncCache } from './coreEntitySync';
import {
  careJournalToRow,
  medicationRequestToRow,
  rowToCareJournal,
  rowToMedicationRequest,
} from './daycareEntityMappers';
import { diffIds } from './utils';

/** 어린이집 알림장·투약 hydrate */
export async function hydrateDaycareEntities(
  organizationId: string,
  cache: SyncCache
): Promise<void> {
  const client = getCoreClient();

  const [journalsResult, medicationsResult] = await Promise.all([
    client.from('care_journals').select('*').eq('organization_id', organizationId),
    client.from('medication_requests').select('*').eq('organization_id', organizationId),
  ]);

  if (journalsResult.error) {
    console.error('Failed to load care_journals:', journalsResult.error);
  }
  if (medicationsResult.error) {
    console.error('Failed to load medication_requests:', medicationsResult.error);
  }

  const entities: [StorageKey, unknown][] = [
    [STORAGE_KEYS.CARE_JOURNALS, (journalsResult.data || []).map(rowToCareJournal)],
    [STORAGE_KEYS.MEDICATION_REQUESTS, (medicationsResult.data || []).map(rowToMedicationRequest)],
  ];

  for (const [key, value] of entities) {
    cache.set(key, value);
    writeLocal(key, value);
  }
}

/** 어린이집 알림장·투약 persist */
export async function persistDaycareEntity(
  key: StorageKey,
  organizationId: string,
  cache: SyncCache
): Promise<void> {
  if (!DAYCARE_SYNC_KEYS.has(key)) return;

  switch (key) {
    case STORAGE_KEYS.CARE_JOURNALS:
      return persistDaycareTable(
        'care_journals',
        organizationId,
        cache,
        STORAGE_KEYS.CARE_JOURNALS,
        (items) => (items as CareJournal[]).map((j) => careJournalToRow(j, organizationId))
      );
    case STORAGE_KEYS.MEDICATION_REQUESTS:
      return persistDaycareTable(
        'medication_requests',
        organizationId,
        cache,
        STORAGE_KEYS.MEDICATION_REQUESTS,
        (items) =>
          (items as MedicationRequest[]).map((r) => medicationRequestToRow(r, organizationId))
      );
    default:
      return;
  }
}

async function persistDaycareTable<T extends { id: string }>(
  table: 'care_journals' | 'medication_requests',
  orgId: string,
  cache: SyncCache,
  storageKey: StorageKey,
  toRows: (items: unknown[]) => T[]
): Promise<void> {
  const client = getCoreClient();
  const items = cache.get<unknown[]>(storageKey) || [];
  const rows = toRows(items);

  const { data: existing, error } = await client
    .from(table)
    .select('id')
    .eq('organization_id', orgId);

  if (error) {
    console.error(`Failed to fetch core.${table}:`, error);
    return;
  }

  const toDelete = diffIds(
    (existing || []).map((r) => r.id),
    rows.map((r) => r.id)
  );
  if (toDelete.length > 0) {
    const { error: deleteError } = await client.from(table).delete().in('id', toDelete);
    if (deleteError) console.error(`Failed to delete from core.${table}:`, deleteError);
  }

  for (const row of rows) {
    const { error: upsertError } = await client.from(table).upsert(row as never);
    if (upsertError) console.error(`Failed to upsert core.${table}:`, upsertError);
  }

  writeLocal(storageKey, items);
}
