import { getCoreClient } from '../../../lib/supabase';
import type { MemberRole, Organization } from '../../../lib/supabase';
import { buildOrganizationSlug } from './organizationSlug';

export { updateOrganizationPublicCode, type UpdatePublicCodeResult } from './organizationPublicCodeService';

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
  const { data, error } = await getCoreClient().rpc('create_organization', {
    p_name: name.trim(),
    p_industry_type: industryType,
    p_slug: buildOrganizationSlug(name),
  });

  if (error) throw error;
  if (!data) throw new Error('Organization 생성에 실패했습니다.');
  return data as string;
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
