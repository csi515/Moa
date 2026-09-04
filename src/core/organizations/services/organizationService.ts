import type { IndustryType } from '@/core/industry/types';
import type { AcademySettings } from '@/types';
import { getCoreClient } from '../../../lib/supabase';
import type { MemberRole, Organization } from '../../../lib/supabase';

const ORG_STORAGE_KEY = 'moa_current_organization_id';

export interface CreateOrganizationOptions {
  name: string;
  industryType?: IndustryType | string;
  settings?: Partial<AcademySettings>;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  role: MemberRole;
  staffId: string | null;
  parentCustomerId: string | null;
  organization: Organization;
  isCurrentContext?: boolean;
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

/**
 * Phase 1: 새 RPC를 사용하여 모든 멤버십과 활성 컨텍스트 정보를 함께 가져옴
 */
export async function fetchUserMembershipsWithContext(): Promise<OrganizationMembership[]> {
  const { data, error } = await getCoreClient().rpc('get_user_memberships' as any);

  if (error) throw error;

  return ((data as any[]) ?? []).map((row: any) => ({
    id: row.membership_id,
    organizationId: row.organization_id,
    role: row.role as MemberRole,
    staffId: row.staff_id ?? null,
    parentCustomerId: row.parent_customer_id ?? null,
    isCurrentContext: row.is_current_context ?? false,
    organization: {
      id: row.organization_id,
      name: row.organization_name,
      industry_type: row.organization_industry_type,
      slug: row.organization_slug,
      settings: row.organization_settings,
      is_active: row.organization_is_active,
      created_at: '',
      updated_at: '',
    } as Organization,
  }));
}

/**
 * Phase 1: 활성 멤버십 컨텍스트 설정
 */
export async function setActiveMembership(membershipId: string): Promise<void> {
  const { error } = await getCoreClient().rpc('set_active_membership' as any, {
    p_membership_id: membershipId,
  });

  if (error) throw error;
}

/**
 * Phase 1: 활성 멤버십 컨텍스트 클리어
 */
export async function clearActiveMembership(): Promise<void> {
  const { error } = await getCoreClient().rpc('clear_active_membership' as any);

  if (error) throw error;
}

export async function createOrganization(
  nameOrOptions: string | CreateOrganizationOptions,
  industryType = 'piano',
  settings?: Partial<AcademySettings>
): Promise<string> {
  const options: CreateOrganizationOptions =
    typeof nameOrOptions === 'string'
      ? { name: nameOrOptions, industryType, settings }
      : nameOrOptions;

  const name = options.name.trim();
  const resolvedIndustryType = options.industryType ?? 'piano';
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || `org-${Date.now()}`;

  const { data, error } = await getCoreClient().rpc('create_organization', {
    p_name: name,
    p_industry_type: resolvedIndustryType,
    p_slug: slug,
    p_settings: (options.settings ?? {}) as Record<string, unknown>,
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
    instructor: '강사',
    member: '회원',
    customer: '고객',
    guardian: '보호자',
  };
  return labels[role];
}

/** 조직 삭제 (소유자만 가능) */
export async function deleteOrganization(organizationId: string): Promise<void> {
  const { data, error } = await getCoreClient().rpc('delete_organization' as any, {
    p_organization_id: organizationId,
  });

  if (error) throw error;
  if (!data) throw new Error('조직 삭제에 실패했습니다.');
}

/** 조직 이름 및 설정 업데이트 */
export async function updateOrganization(
  organizationId: string,
  updates: {
    name?: string;
    settings?: Partial<AcademySettings>;
  }
): Promise<void> {
  const payload: any = {};

  if (updates.name !== undefined) {
    payload.name = updates.name;
  }

  if (updates.settings !== undefined) {
    const { data: currentOrg, error: fetchError } = await getCoreClient()
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .single();

    if (fetchError) throw fetchError;

    const currentSettings = (currentOrg?.settings as Record<string, unknown>) ?? {};
    payload.settings = { ...currentSettings, ...updates.settings };
  }

  const { error } = await getCoreClient()
    .from('organizations')
    .update(payload)
    .eq('id', organizationId);

  if (error) throw error;
}
