/**
 * 향후 location-scoped permission 판정용 공통 helper.
 * 기존 RLS / is_org_admin 화면 체크를 교체하지 않는다.
 */
import { compatIsOrgAdmin } from './compatibility';
import { isKnownPermission, isKnownScopeType } from './registry';
import { roleHasDefaultPermission } from './roleDefaults';
import { isValidScope, organizationScopeCovers, scopeTargetId } from './scopes';
import type { AuthorizationGrant, AuthScopeType, EvaluatePermissionInput } from './types';

function grantMatches(grant: AuthorizationGrant, input: EvaluatePermissionInput): boolean {
  if (!grant.active) return false;
  if (grant.organizationId !== input.scope.organizationId) return false;
  if (grant.permission !== input.permission) return false;
  if (grant.scopeType === 'organization') return true;
  return grant.scopeType === input.scope.type && grant.scopeId === scopeTargetId(input.scope);
}

function assignmentIds(
  explicit: readonly string[] | null | undefined,
  grants: readonly AuthorizationGrant[] | null | undefined,
  scopeType: AuthScopeType
): readonly string[] | null {
  if (explicit != null) return explicit;
  const fromGrants = (grants ?? [])
    .filter((row) => row.active && row.scopeType === scopeType && row.scopeId)
    .map((row) => row.scopeId as string);
  return fromGrants.length > 0 ? fromGrants : null;
}

function assignmentAllows(input: EvaluatePermissionInput): boolean {
  const { scope } = input;
  if (scope.type === 'organization') return true;

  const target = scopeTargetId(scope);
  const assigned =
    scope.type === 'location'
      ? assignmentIds(input.assignedLocationIds, input.extraGrants, 'location')
      : scope.type === 'customer'
        ? assignmentIds(input.assignedCustomerIds, input.extraGrants, 'customer')
        : assignmentIds(input.assignedResourceIds, input.extraGrants, 'resource');

  if (assigned == null || assigned.length === 0) return true;
  return target != null && assigned.includes(target);
}

export function evaluatePermission(input: EvaluatePermissionInput): boolean {
  if (!isKnownPermission(input.permission)) return false;
  if (!isValidScope(input.scope) || !isKnownScopeType(input.scope.type)) return false;
  if (!organizationScopeCovers(input.scope.type)) return false;

  if ((input.extraGrants ?? []).some((grant) => grantMatches(grant, input))) {
    return true;
  }

  if (compatIsOrgAdmin(input.role)) {
    return true;
  }

  if (!roleHasDefaultPermission(input.role, input.permission)) {
    return false;
  }

  return assignmentAllows(input);
}

export function canAuthorize(
  role: string | null | undefined,
  permission: string,
  scope: EvaluatePermissionInput['scope'],
  extras?: Omit<EvaluatePermissionInput, 'role' | 'permission' | 'scope'>
): boolean {
  return evaluatePermission({ role, permission, scope, ...extras });
}
