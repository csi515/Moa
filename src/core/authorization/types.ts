/** Role + Permission + Scope 권한 기반. 기존 member_role / RLS helper를 대체하지 않는다. */

export const AUTH_SCOPE_TYPES = ['organization', 'location', 'resource', 'customer'] as const;

export type AuthScopeType = (typeof AUTH_SCOPE_TYPES)[number];

/** 권한 판정 범위. organization_id가 테넌트 경계이며 location/resource/customer는 하위 범위. */
export type AuthScope = {
  type: AuthScopeType;
  organizationId: string;
  locationId?: string | null;
  resourceId?: string | null;
  customerId?: string | null;
};

export type PermissionDefinition = {
  key: Permission;
  resource: string;
  action: string;
  description: string;
};

export type Permission =
  | 'customers.read'
  | 'customers.write'
  | 'sales.read'
  | 'sales.create'
  | 'sales.refund'
  | 'rooms.read'
  | 'rooms.manage'
  | 'staff.read'
  | 'staff.manage'
  | 'reports.read'
  | 'finance.read';

/** 향후 지점/리소스 한정 grant. 현재 화면은 쓰지 않는다. */
export type AuthorizationGrant = {
  organizationId: string;
  userId?: string | null;
  permission: Permission | string;
  scopeType: AuthScopeType;
  scopeId?: string | null;
  active: boolean;
};

export type EvaluatePermissionInput = {
  role: string | null | undefined;
  permission: string;
  scope: AuthScope;
  /** 지점 배정. 비어 있으면 제한 없음 (현재 staff 호환) */
  assignedLocationIds?: readonly string[] | null;
  assignedCustomerIds?: readonly string[] | null;
  assignedResourceIds?: readonly string[] | null;
  extraGrants?: readonly AuthorizationGrant[] | null;
};
