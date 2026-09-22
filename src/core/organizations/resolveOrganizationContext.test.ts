/**
 * OrganizationProvider 선택/부트스트랩 순수 로직 unit test
 * 실행: npm run test:org-context-resolve
 */
import assert from 'node:assert/strict';
import type { Organization } from '../../lib/supabase';
import type { OrganizationMembership } from './services/organizationService';
import {
  deriveSelectionFields,
  resolveMembershipById,
  resolveMembershipByOrganizationId,
  resolveOrganizationBootstrap,
} from './resolveOrganizationContext';

function org(id: string, name = id): Organization {
  return {
    id,
    name,
    industry_type: 'piano',
    slug: null,
    settings: {},
    is_active: true,
    public_code: '',
    created_at: '',
    updated_at: '',
  } as Organization;
}

function mem(
  partial: Partial<OrganizationMembership> &
    Pick<OrganizationMembership, 'id' | 'organizationId' | 'role'>
): OrganizationMembership {
  return {
    staffId: null,
    parentCustomerId: null,
    organization: org(partial.organizationId),
    ...partial,
  };
}

// ── resolveMembershipById ─────────────────────────────────────────
{
  const list = [mem({ id: 'm1', organizationId: 'o1', role: 'admin' })];
  assert.deepEqual(resolveMembershipById(list, null).storage, { action: 'unchanged' });
  assert.equal(resolveMembershipById(list, null).membership, null);
  assert.equal(resolveMembershipById([], 'm1').membership, null);
  assert.equal(resolveMembershipById(list, 'm1').membership?.id, 'm1');
  assert.deepEqual(resolveMembershipById(list, 'm1').storage, {
    action: 'store',
    organizationId: 'o1',
  });
  assert.deepEqual(resolveMembershipById(list, 'missing').storage, { action: 'clear' });
}

// ── resolveMembershipByOrganizationId ─────────────────────────────
{
  const list = [mem({ id: 'm1', organizationId: 'o1', role: 'staff' })];
  assert.equal(resolveMembershipByOrganizationId(list, 'o1').membership?.id, 'm1');
  assert.deepEqual(resolveMembershipByOrganizationId(list, 'nope').storage, {
    action: 'clear',
  });
  assert.deepEqual(resolveMembershipByOrganizationId(list, null).storage, {
    action: 'unchanged',
  });
}

// ── deriveSelectionFields ─────────────────────────────────────────
{
  const m = mem({
    id: 'm1',
    organizationId: 'o1',
    role: 'owner',
    staffId: 'st1',
    parentCustomerId: 'pc1',
  });
  const d = deriveSelectionFields(m);
  assert.equal(d.currentOrganization?.id, 'o1');
  assert.equal(d.currentRole, 'owner');
  assert.equal(d.currentStaffId, 'st1');
  assert.equal(d.currentParentCustomerId, 'pc1');
  assert.equal(deriveSelectionFields(null).currentOrganization, null);
}

// ── bootstrap: parent portal mode ─────────────────────────────────
{
  const { decision } = resolveOrganizationBootstrap({
    memberships: [mem({ id: 'm1', organizationId: 'o1', role: 'admin' })],
    blockedOwnerOrgIds: [],
    portalChildren: 0,
    parentId: 'p1',
    parentPortalModeActive: true,
    storedOrganizationId: null,
  });
  assert.equal(decision.kind, 'enter_parent');
}

// ── bootstrap: customer-only (no staff) ───────────────────────────
{
  const { decision, flags } = resolveOrganizationBootstrap({
    memberships: [mem({ id: 'c1', organizationId: 'o1', role: 'customer' })],
    blockedOwnerOrgIds: [],
    portalChildren: 0,
    parentId: null,
    parentPortalModeActive: false,
    storedOrganizationId: null,
  });
  assert.equal(flags.isCustomerOnly, true);
  assert.equal(decision.kind, 'enter_customer');
  if (decision.kind === 'enter_customer') assert.equal(decision.membershipId, 'c1');
}

// ── bootstrap: single staff auto-select ───────────────────────────
{
  const { decision } = resolveOrganizationBootstrap({
    memberships: [mem({ id: 's1', organizationId: 'o1', role: 'admin' })],
    blockedOwnerOrgIds: [],
    portalChildren: 0,
    parentId: null,
    parentPortalModeActive: false,
    storedOrganizationId: null,
  });
  assert.equal(decision.kind, 'select_organization_or_clear');
  if (decision.kind === 'select_organization_or_clear') {
    assert.equal(decision.organizationId, 'o1');
  }
}

// ── bootstrap: multi staff → clear (need picker) ──────────────────
{
  const { decision } = resolveOrganizationBootstrap({
    memberships: [
      mem({ id: 's1', organizationId: 'o1', role: 'admin' }),
      mem({ id: 's2', organizationId: 'o2', role: 'staff' }),
    ],
    blockedOwnerOrgIds: [],
    portalChildren: 0,
    parentId: null,
    parentPortalModeActive: false,
    storedOrganizationId: null,
  });
  assert.equal(decision.kind, 'select_organization_or_clear');
  if (decision.kind === 'select_organization_or_clear') {
    assert.equal(decision.organizationId, null);
  }
}

// ── bootstrap: stored org preferred ───────────────────────────────
{
  const { decision } = resolveOrganizationBootstrap({
    memberships: [
      mem({ id: 's1', organizationId: 'o1', role: 'admin' }),
      mem({ id: 's2', organizationId: 'o2', role: 'staff' }),
    ],
    blockedOwnerOrgIds: [],
    portalChildren: 0,
    parentId: null,
    parentPortalModeActive: false,
    storedOrganizationId: 'o2',
  });
  assert.equal(decision.kind, 'select_organization_or_clear');
  if (decision.kind === 'select_organization_or_clear') {
    assert.equal(decision.organizationId, 'o2');
  }
}

// ── bootstrap: current context membership ─────────────────────────
{
  const { decision } = resolveOrganizationBootstrap({
    memberships: [
      mem({ id: 's1', organizationId: 'o1', role: 'admin' }),
      mem({ id: 's2', organizationId: 'o2', role: 'staff', isCurrentContext: true }),
    ],
    blockedOwnerOrgIds: [],
    portalChildren: 0,
    parentId: null,
    parentPortalModeActive: false,
    storedOrganizationId: 'o1',
  });
  assert.equal(decision.kind, 'select_membership');
  if (decision.kind === 'select_membership') assert.equal(decision.membershipId, 's2');
}

console.log('resolveOrganizationContext.test.ts: ok');
