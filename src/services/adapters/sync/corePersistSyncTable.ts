import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/supabase/database.types';
import type { PersistAbortGuard } from './syncTypes';
import { upsertThenDiffDelete } from './persistHelpers';

export type CoreClient = SupabaseClient<Database, 'core'>;

/** Core org 테이블 upsert 후 id diff-delete */
export async function syncTable(
  client: CoreClient,
  table:
    | 'staff'
    | 'customers'
    | 'services'
    | 'schedules'
    | 'payments'
    | 'payment_transactions'
    | 'expenses'
    | 'income_entries'
    | 'consultations'
    | 'notifications'
    | 'attendance_sessions',
  orgId: string,
  currentIds: string[],
  upsertAll: () => Promise<void>,
  options: { cachePresent: boolean; context: string; isAborted?: PersistAbortGuard }
): Promise<void> {
  await upsertThenDiffDelete({
    context: options.context,
    cachePresent: options.cachePresent,
    currentIds,
    isAborted: options.isAborted,
    upsertAll,
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
}
