import type { GuardianRelationship, ParentStudentLink } from '@/core/parent/types';
import { getCoreClient } from '@/lib/supabase';
import { StorageService } from '@/services/storage';
import { linkToRow } from '@/services/adapters/sync/parentLinkEntityMappers';

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

/** 조직 전체 parent_student_links 동기화 (storage → Supabase) */
export async function syncAllParentStudentLinks(organizationId: string): Promise<void> {
  const client = getCoreClient();
  const links = StorageService.getParentStudentLinks();

  const { error: deleteError } = await client
    .from('parent_student_links')
    .delete()
    .eq('organization_id', organizationId);
  if (deleteError) throw deleteError;

  if (links.length === 0) return;

  const rows = links.map((l) => linkToRow(l, organizationId));
  const { error } = await client.from('parent_student_links').insert(rows);
  if (error) throw error;
}

/** 특정 학부모의 links만 동기화 (legacy 호환) */
export async function syncParentStudentLinks(
  organizationId: string,
  parentCustomerId: string,
  studentIds?: string[]
): Promise<void> {
  if (studentIds) {
    const links = StorageService.getParentStudentLinks();
    const existing = links.filter((l) => l.parentId === parentCustomerId);
    for (const sid of studentIds) {
      if (!existing.some((l) => l.studentId === sid)) {
        StorageService.linkParentToStudent({
          parentId: parentCustomerId,
          studentId: sid,
          relationship: 'other',
          isPrimary: existing.length === 0,
        });
      }
    }
  }
  await syncAllParentStudentLinks(organizationId);
}

/** 전체 links 재구성 */
export async function rebuildAllParentStudentLinks(organizationId: string): Promise<void> {
  StorageService.rebuildParentStudentIdsFromLinks();
  await syncAllParentStudentLinks(organizationId);
}

/** links에서 관계 포함 row 생성 (내부용) */
export function getLinkRowsForParent(
  organizationId: string,
  parentId: string,
  links: ParentStudentLink[]
): ReturnType<typeof linkToRow>[] {
  return links.filter((l) => l.parentId === parentId).map((l) => linkToRow(l, organizationId));
}

export type { GuardianRelationship, ParentStudentLink };
