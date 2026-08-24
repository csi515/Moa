import { getCoreClient } from '../../../lib/supabase';
import type { MemberRole, Organization } from '../../../lib/supabase';

const ORG_STORAGE_KEY = 'moa_current_organization_id';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  role: MemberRole;
  staffId: string | null;
  parentCustomerId: string | null;
  organization: Organization;
}

export function getStoredOrganizationId(): string | null {
  return localStorage.getItem(ORG_STORAGE_KEY);
}

export function storeOrganizationId(organizationId: string): void {
  localStorage.setItem(ORG_STORAGE_KEY, organizationId);
}

export function clearStoredOrganizationId(): void {
  localStorage.removeItem(ORG_STORAGE_KEY);
}

export async function fetchUserOrganizations(userId: string): Promise<OrganizationMembership[]> {
  const { data, error } = await getCoreClient()
    .from('organization_members')
    .select(
      `
        id,
        role,
        organization_id,
        staff_id,
        parent_customer_id,
        organizations (
          id,
          name,
          industry_type,
          slug,
          public_code,
          settings,
          is_active,
          created_at,
          updated_at
        )
      `
    )
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.organizations)
    .map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      role: row.role as MemberRole,
      staffId: row.staff_id ?? null,
      parentCustomerId: row.parent_customer_id ?? null,
      organization: row.organizations as Organization,
    }));
}

export async function createOrganization(
  name: string,
  industryType = 'piano'
): Promise<string> {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || `org-${Date.now()}`;

  const { data, error } = await getCoreClient().rpc('create_organization', {
    p_name: name.trim(),
    p_industry_type: industryType,
    p_slug: slug,
  });

  if (error) throw error;
  if (!data) throw new Error('Organization 생성에 실패했습니다.');
  return data as string;
}

export type UpdatePublicCodeResult =
  | { success: true; publicCode: string }
  | { error: string };

/** 업체 공개 코드 변경 (DB 유일성 검증) */
export async function updateOrganizationPublicCode(
  organizationId: string,
  publicCode: string
): Promise<UpdatePublicCodeResult> {
  const { data, error } = await getCoreClient().rpc(
    'update_organization_public_code' as never,
    {
      p_organization_id: organizationId,
      p_public_code: publicCode,
    } as never
  );

  if (error) {
    console.error('update_organization_public_code failed:', error);
    return { error: 'request_failed' };
  }

  const row = data as { error?: string; success?: boolean; publicCode?: string } | null;
  if (!row?.success || !row.publicCode) {
    return { error: row?.error ?? 'request_failed' };
  }

  return { success: true, publicCode: row.publicCode };
}

/** org 멤버 role 라벨 */
export function getRoleLabel(role: MemberRole): string {
  const labels: Record<MemberRole, string> = {
    owner: '원장',
    admin: '관리자',
    manager: '매니저',
    staff: '강사',
    parent: '학부모',
  };
  return labels[role];
}
