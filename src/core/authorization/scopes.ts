import { isKnownScopeType } from './registry';
import type { AuthScope, AuthScopeType } from './types';

export function organizationScope(organizationId: string): AuthScope {
  return { type: 'organization', organizationId };
}

export function locationScope(organizationId: string, locationId: string): AuthScope {
  return { type: 'location', organizationId, locationId };
}

export function customerScope(organizationId: string, customerId: string): AuthScope {
  return { type: 'customer', organizationId, customerId };
}

export function resourceScope(organizationId: string, resourceId: string): AuthScope {
  return { type: 'resource', organizationId, resourceId };
}

export function scopeTargetId(scope: AuthScope): string | null {
  if (scope.type === 'location') return scope.locationId ?? null;
  if (scope.type === 'resource') return scope.resourceId ?? null;
  if (scope.type === 'customer') return scope.customerId ?? null;
  return null;
}

/** 본사(organization) 범위는 하위 location/resource/customer를 포함한다. */
export function organizationScopeCovers(requested: AuthScopeType): boolean {
  return isKnownScopeType(requested);
}

export function isValidScope(scope: AuthScope | null | undefined): boolean {
  if (!scope?.organizationId) return false;
  return isKnownScopeType(scope.type);
}
