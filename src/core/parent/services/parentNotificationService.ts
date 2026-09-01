import { getCoreClient } from '@/lib/supabase';
import { notificationRowToApp } from '@/services/adapters/sync/entityMappers';
import type { AppNotification } from '@/types';

/** 학부모 포털: Supabase RLS로 자녀 관련 알림 조회 */
export async function fetchParentNotificationsForStudent(
  organizationId: string,
  customerId: string,
  limit = 30
): Promise<AppNotification[]> {
  const { data, error } = await getCoreClient()
    .from('notifications')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('status', 'sent')
    .or(`target_id.eq.${customerId},target_type.eq.all`)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map(notificationRowToApp);
}
