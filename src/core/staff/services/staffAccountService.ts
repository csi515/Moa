import { getCoreClient } from '../../../lib/supabase';
import { parseStaffLinkCodeFromResult, type StaffInviteLinkCode } from './staffInviteLinkService';

export type StaffAccountStatus = 'none' | 'invited' | 'connected';

export interface StaffAccountStatusItem {
  staffId: string;
  status: StaffAccountStatus;
  email: string | null;
  invitedAt: string | null;
}

export interface InviteStaffResult {
  status: StaffAccountStatus;
  staffId: string;
  userId?: string;
  invitationId?: string;
  email?: string;
  organizationName?: string;
  linkCode?: StaffInviteLinkCode | null;
}

export interface ConnectStaffResult {
  connected: number;
  memberships: Array<{ organization_id: string; staff_id: string }>;
}

/** 로그인 시 pending 초대를 계정에 연결 */
export async function connectStaffOnLogin(): Promise<ConnectStaffResult> {
  const { data, error } = await getCoreClient().rpc('connect_staff_on_login');
  if (error) throw error;
  const result = data as {
    connected: number;
    memberships: Array<{ organization_id: string; staff_id: string }>;
  };
  return {
    connected: result.connected ?? 0,
    memberships: result.memberships ?? [],
  };
}

/** 강사 계정 초대 (이메일 기준) */
export async function inviteStaffMember(
  organizationId: string,
  staffId: string,
  email: string
): Promise<InviteStaffResult> {
  const { data, error } = await getCoreClient().rpc('invite_staff_member', {
    p_org_id: organizationId,
    p_staff_id: staffId,
    p_email: email.trim(),
  });
  if (error) throw error;

  const result = data as {
    status: StaffAccountStatus;
    staff_id: string;
    user_id?: string;
    invitation_id?: string;
    email?: string;
    organization_name?: string;
    link_code?: unknown;
  };

  return {
    status: result.status,
    staffId: result.staff_id,
    userId: result.user_id,
    invitationId: result.invitation_id,
    email: result.email,
    organizationName: result.organization_name,
    linkCode: parseStaffLinkCodeFromResult({ link_code: result.link_code }),
  };
}

/** pending 초대 취소 */
export async function revokeStaffInvitation(
  organizationId: string,
  staffId: string
): Promise<void> {
  const { error } = await getCoreClient().rpc('revoke_staff_invitation', {
    p_org_id: organizationId,
    p_staff_id: staffId,
  });
  if (error) throw error;
}

export type StaffEmploymentStatus = 'active' | 'inactive' | 'resigned';

/** 재직 상태 변경 — organization_members.is_active 동기화 (기록 보존) */
export async function updateStaffEmploymentStatus(
  organizationId: string,
  staffId: string,
  status: StaffEmploymentStatus
): Promise<void> {
  const { error } = await getCoreClient().rpc('update_staff_employment_status', {
    p_org_id: organizationId,
    p_staff_id: staffId,
    p_status: status,
  });
  if (error) throw error;
}

/** 조직 내 강사별 계정 연결 상태 조회 */
export async function fetchStaffAccountStatuses(
  organizationId: string
): Promise<StaffAccountStatusItem[]> {
  const { data, error } = await getCoreClient().rpc('get_staff_account_statuses', {
    p_org_id: organizationId,
  });
  if (error) throw error;

  const rows = (data ?? []) as Array<{
    staff_id: string;
    status: StaffAccountStatus;
    email: string | null;
    invited_at: string | null;
  }>;

  return rows.map((row) => ({
    staffId: row.staff_id,
    status: row.status,
    email: row.email,
    invitedAt: row.invited_at,
  }));
}
