/**
 * OrganizationProvider 선택/부트스트랩 순수 로직.
 * 부작용(localStorage·React setState)은 Provider가 commit 시 수행한다.
 */
import type { MemberRole } from '../../lib/supabase';
import type { OrganizationMembership } from './services/organizationService';

export const STAFF_ROLES = new Set<string>([
  'owner',
  'admin',
  'manager',
  'staff',
  'instructor',
]);
export const CUSTOMER_ROLES = new Set<string>(['customer', 'member']);

export type MembershipStorageAction =
  | { action: 'store'; organizationId: string }
  | { action: 'clear' }
  | { action: 'unchanged' };

export type MembershipSelectionResult = {
  membership: OrganizationMembership | null;
  storage: MembershipStorageAction;
};

/** membershipId로 선택. null/빈 목록 → 선택 해제(storage 유지). 미존재 id → 해제 + storage clear. */
export function resolveMembershipById(
  memberships: OrganizationMembership[],
  membershipId: string | null
): MembershipSelectionResult {
  if (!membershipId || memberships.length === 0) {
    return { membership: null, storage: { action: 'unchanged' } };
  }
  const membership = memberships.find((m) => m.id === membershipId);
  if (membership) {
    return {
      membership,
      storage: { action: 'store', organizationId: membership.organizationId },
    };
  }
  return { membership: null, storage: { action: 'clear' } };
}

/** organizationId로 선택(동일 org 내 첫 멤버십). 규칙은 resolveMembershipById와 대칭. */
export function resolveMembershipByOrganizationId(
  memberships: OrganizationMembership[],
  organizationId: string | null
): MembershipSelectionResult {
  if (!organizationId || memberships.length === 0) {
    return { membership: null, storage: { action: 'unchanged' } };
  }
  const membership = memberships.find((m) => m.organizationId === organizationId);
  if (membership) {
    return {
      membership,
      storage: { action: 'store', organizationId },
    };
  }
  return { membership: null, storage: { action: 'clear' } };
}

export type PortalAccessFlags = {
  canAccessParentPortal: boolean;
  canAccessCustomerPortal: boolean;
  isParentOnly: boolean;
  isCustomerOnly: boolean;
};

export function computePortalAccessFlags(
  memberships: OrganizationMembership[],
  opts: {
    blockedOwnerOrgIds: string[];
    portalChildren: number;
    parentId: string | null;
  }
): PortalAccessFlags & {
  staffMemberships: OrganizationMembership[];
  customerMemberships: OrganizationMembership[];
  hasParentAccess: boolean;
} {
  const blocked = new Set(opts.blockedOwnerOrgIds);
  const isBlockedOwner = (m: OrganizationMembership) =>
    m.role === 'owner' && blocked.has(m.organizationId);

  const staffMemberships = memberships.filter(
    (m) => STAFF_ROLES.has(m.role) && !isBlockedOwner(m)
  );
  const customerMemberships = memberships.filter((m) => CUSTOMER_ROLES.has(m.role));
  const hasLegacyParentMembership = memberships.some(
    (m) => m.role === 'parent' || m.role === 'guardian'
  );
  const hasParentAccess = opts.portalChildren > 0 || hasLegacyParentMembership;

  const isParentOnly =
    staffMemberships.length === 0 && hasParentAccess && customerMemberships.length === 0;
  const isCustomerOnly =
    staffMemberships.length === 0 && !hasParentAccess && customerMemberships.length > 0;

  return {
    staffMemberships,
    customerMemberships,
    hasParentAccess,
    canAccessParentPortal: hasParentAccess && opts.parentId !== null,
    canAccessCustomerPortal: customerMemberships.length > 0,
    isParentOnly,
    isCustomerOnly,
  };
}

/**
 * 로그인/refresh 후 어떤 선택·포털로 갈지.
 * Provider의 refreshOrganizations 분기 순서를 그대로 보존한다.
 */
export type OrganizationBootstrapDecision =
  | { kind: 'enter_parent' }
  | { kind: 'enter_customer'; membershipId: string }
  | { kind: 'select_membership'; membershipId: string }
  | { kind: 'select_organization'; organizationId: string }
  | { kind: 'select_organization_or_clear'; organizationId: string | null };

export function resolveOrganizationBootstrap(input: {
  memberships: OrganizationMembership[];
  blockedOwnerOrgIds: string[];
  portalChildren: number;
  parentId: string | null;
  parentPortalModeActive: boolean;
  storedOrganizationId: string | null;
}): {
  flags: PortalAccessFlags;
  decision: OrganizationBootstrapDecision;
} {
  const access = computePortalAccessFlags(input.memberships, {
    blockedOwnerOrgIds: input.blockedOwnerOrgIds,
    portalChildren: input.portalChildren,
    parentId: input.parentId,
  });
  const {
    staffMemberships,
    customerMemberships,
    isParentOnly,
    isCustomerOnly,
    canAccessParentPortal,
    canAccessCustomerPortal,
  } = access;

  const flags: PortalAccessFlags = {
    canAccessParentPortal,
    canAccessCustomerPortal,
    isParentOnly,
    isCustomerOnly,
  };

  const blocked = new Set(input.blockedOwnerOrgIds);
  const isBlockedOwner = (m: OrganizationMembership) =>
    m.role === 'owner' && blocked.has(m.organizationId);

  // 1. OAuth/딥링크 후 학부모 포털 모드
  if (input.parentPortalModeActive && input.parentId !== null) {
    return { flags, decision: { kind: 'enter_parent' } };
  }

  // 2. staff 없고 customer만 (부모 접근과 무관 — 기존 순서)
  if (staffMemberships.length === 0 && customerMemberships.length > 0) {
    const preferred =
      customerMemberships.find((m) => m.isCurrentContext) || customerMemberships[0];
    return { flags, decision: { kind: 'enter_customer', membershipId: preferred.id } };
  }

  // 3–4. parent-only / customer-only
  if (isParentOnly) {
    return { flags, decision: { kind: 'enter_parent' } };
  }
  if (isCustomerOnly) {
    const preferred =
      customerMemberships.find((m) => m.isCurrentContext) || customerMemberships[0];
    return { flags, decision: { kind: 'enter_customer', membershipId: preferred.id } };
  }

  // 5. 활성 컨텍스트 멤버십
  const currentContextMembership = input.memberships.find((m) => m.isCurrentContext);
  if (currentContextMembership && !isBlockedOwner(currentContextMembership)) {
    return {
      flags,
      decision: { kind: 'select_membership', membershipId: currentContextMembership.id },
    };
  }

  // 6. staff 없고 blocked owner만
  if (staffMemberships.length === 0) {
    const blockedOwner = input.memberships.find((m) => isBlockedOwner(m));
    if (blockedOwner) {
      return {
        flags,
        decision: {
          kind: 'select_organization',
          organizationId: blockedOwner.organizationId,
        },
      };
    }
  }

  // 7. stored / 단일 staff / clear
  const storedMembership = input.storedOrganizationId
    ? input.memberships.find((m) => m.organizationId === input.storedOrganizationId)
    : undefined;
  const storedUsable = Boolean(storedMembership && !isBlockedOwner(storedMembership));
  const autoId = storedUsable
    ? input.storedOrganizationId
    : staffMemberships.length === 1
      ? staffMemberships[0].organizationId
      : null;

  return {
    flags,
    decision: { kind: 'select_organization_or_clear', organizationId: autoId },
  };
}

/** selectedMembership에서 context에 노출하는 파생 필드 */
export function deriveSelectionFields(membership: OrganizationMembership | null): {
  currentOrganization: OrganizationMembership['organization'] | null;
  currentRole: MemberRole | null;
  currentStaffId: string | null;
  currentParentCustomerId: string | null;
} {
  if (!membership) {
    return {
      currentOrganization: null,
      currentRole: null,
      currentStaffId: null,
      currentParentCustomerId: null,
    };
  }
  return {
    currentOrganization: membership.organization,
    currentRole: membership.role,
    currentStaffId: membership.staffId,
    currentParentCustomerId: membership.parentCustomerId,
  };
}
