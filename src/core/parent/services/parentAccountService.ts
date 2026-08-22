import { getCoreClient } from '../../../lib/supabase';
import { StorageService } from '../../../services/storage';

export type ParentAccountStatus = 'none' | 'invited' | 'connected';

export interface ParentAccountStatusItem {
  parentCustomerId: string;
  status: ParentAccountStatus;
  email: string | null;
  invitedAt: string | null;
}

export interface InviteParentResult {
  status: ParentAccountStatus;
  parentCustomerId: string;
  userId?: string;
  invitationId?: string;
  email?: string;
}

export interface ConnectParentResult {
  connected: number;
  memberships: Array<{ organization_id: string; parent_customer_id: string }>;
}

export async function connectParentOnLogin(): Promise<ConnectParentResult> {
  const { data, error } = await getCoreClient().rpc('connect_parent_on_login');
  if (error) throw error;
  const result = data as {
    connected: number;
    memberships: Array<{ organization_id: string; parent_customer_id: string }>;
  };
  return {
    connected: result.connected ?? 0,
    memberships: result.memberships ?? [],
  };
}

export async function inviteParentMember(
  organizationId: string,
  parentCustomerId: string,
  email: string
): Promise<InviteParentResult> {
  const { data, error } = await getCoreClient().rpc('invite_parent_member', {
    p_org_id: organizationId,
    p_parent_customer_id: parentCustomerId,
    p_email: email.trim(),
  });
  if (error) throw error;

  const result = data as {
    status: ParentAccountStatus;
    parent_customer_id: string;
    user_id?: string;
    invitation_id?: string;
    email?: string;
  };

  return {
    status: result.status,
    parentCustomerId: result.parent_customer_id,
    userId: result.user_id,
    invitationId: result.invitation_id,
    email: result.email,
  };
}

export async function revokeParentInvitation(
  organizationId: string,
  parentCustomerId: string
): Promise<void> {
  const { error } = await getCoreClient().rpc('revoke_parent_invitation', {
    p_org_id: organizationId,
    p_parent_customer_id: parentCustomerId,
  });
  if (error) throw error;
}

export async function fetchParentAccountStatuses(
  organizationId: string
): Promise<ParentAccountStatusItem[]> {
  const { data, error } = await getCoreClient().rpc('get_parent_account_statuses', {
    p_org_id: organizationId,
  });
  if (error) throw error;

  const rows = (data as ParentAccountStatusItem[] | null) ?? [];
  return rows.map((r) => ({
    parentCustomerId: (r as any).parent_customer_id ?? r.parentCustomerId,
    status: r.status,
    email: r.email,
    invitedAt: (r as any).invited_at ?? r.invitedAt,
  }));
}

/** 학부모-자녀 링크 동기화 (studentIds 기반) */
export async function syncParentStudentLinks(
  organizationId: string,
  parentCustomerId: string,
  studentIds: string[]
): Promise<void> {
  const client = getCoreClient();
  await client
    .from('parent_student_links')
    .delete()
    .eq('organization_id', organizationId)
    .eq('parent_customer_id', parentCustomerId);

  if (studentIds.length === 0) return;

  const rows = studentIds.map((sid) => ({
    organization_id: organizationId,
    parent_customer_id: parentCustomerId,
    student_customer_id: sid,
    relationship: 'parent',
    is_primary: true,
  }));

  const { error } = await client.from('parent_student_links').insert(rows);
  if (error) throw error;
}

/** 전체 학부모-자녀 링크를 Parent.studentIds에서 재구성 */
export async function rebuildAllParentStudentLinks(organizationId: string): Promise<void> {
  const parents = StorageService.getParents();
  for (const p of parents) {
    if (p.studentIds.length > 0) {
      await syncParentStudentLinks(organizationId, p.id, p.studentIds);
    }
  }
}
