import { getCoreClient } from '../../../lib/supabase';
import type { MemberRole, Organization } from '../../../lib/supabase';

const ORG_STORAGE_KEY = 'moa_current_organization_id';

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  role: MemberRole;
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
        organizations (
          id,
          name,
          industry_type,
          slug,
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

/** owner/admin/manager → director, staff → teacher (기존 UI 권한 호환) */
export function mapMemberRoleToAppRole(role: MemberRole): 'director' | 'teacher' {
  return role === 'staff' ? 'teacher' : 'director';
}

export function getRoleLabel(role: MemberRole): string {
  const labels: Record<MemberRole, string> = {
    owner: '원장',
    admin: '관리자',
    manager: '매니저',
    staff: '스태프',
  };
  return labels[role];
}
