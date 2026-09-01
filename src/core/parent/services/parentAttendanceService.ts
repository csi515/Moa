import { getCoreClient } from '@/lib/supabase';
import type { AttendanceSession } from '@/core/attendance/types';
import { coreRowToSession } from '@/services/adapters/sync/attendanceEntityMappers';

/** 학부모 포털: Supabase RLS로 자녀 출결 세션 조회 */
export async function fetchParentAttendanceSessions(
  organizationId: string,
  customerId: string,
  limit = 30
): Promise<AttendanceSession[]> {
  const { data, error } = await getCoreClient()
    .from('attendance_sessions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('customer_id', customerId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(coreRowToSession);
}

/** 오늘 출결 세션만 조회 */
export async function fetchParentTodaySession(
  organizationId: string,
  customerId: string
): Promise<AttendanceSession | undefined> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await getCoreClient()
    .from('attendance_sessions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('customer_id', customerId)
    .eq('session_date', today)
    .maybeSingle();

  if (error) throw error;
  return data ? coreRowToSession(data) : undefined;
}
