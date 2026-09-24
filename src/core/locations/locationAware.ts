/**
 * LocationAware — organization 테넌트 + 선택적 location 하위 범위.
 * 기존 organization_id 를 대체하지 않는다.
 */

export const DOMAIN_SCOPE_KINDS = ['organization', 'location'] as const;

export type DomainScopeKind = (typeof DOMAIN_SCOPE_KINDS)[number];

/** 조직 공유 엔티티. location_id 컬럼을 두지 않는다. */
export type OrganizationScoped = {
  organizationId: string;
};

/** 신규 지점 운영 엔티티. organization_id + location_id(NOT NULL). */
export type LocationScoped = {
  organizationId: string;
  locationId: string;
};

/**
 * 공통 레코드 형태.
 * locationId=null 은 기존 레코드(컬럼 없음/미배정) 호환값이다.
 */
export type LocationAware = {
  organizationId: string;
  locationId: string | null;
};

export type LocationAwarePolicy = {
  kind: DomainScopeKind;
  /** 신규 location-scoped 쓰기만 true. 기존 Core는 false */
  requireLocationOnWrite: boolean;
  /** 선택 지점 조회 시 location_id IS NULL 레코드를 포함할지 */
  includeUnassignedOnRead: boolean;
};

export const ORGANIZATION_SCOPE_POLICY: LocationAwarePolicy = {
  kind: 'organization',
  requireLocationOnWrite: false,
  includeUnassignedOnRead: true,
};

/** 신규 지점 도메인 기본. 기존 테이블에는 적용하지 않는다. */
export const LOCATION_SCOPE_POLICY: LocationAwarePolicy = {
  kind: 'location',
  requireLocationOnWrite: true,
  includeUnassignedOnRead: true,
};

/** 컬럼이 아직 없는 기존 도메인 — 동작 변경 없음 */
export const LEGACY_LOCATION_SCOPE_POLICY: LocationAwarePolicy = {
  kind: 'location',
  requireLocationOnWrite: false,
  includeUnassignedOnRead: true,
};

export const NEW_LOCATION_SCOPED_TABLE_RULES = {
  tenantColumn: 'organization_id',
  locationColumn: 'location_id',
  locationNullable: false,
  locationReferences: 'core.locations(id)',
  organizationReferences: 'core.organizations(id)',
  replaceOrganizationId: false,
} as const;

export function toLocationAware(
  organizationId: string,
  locationId?: string | null
): LocationAware {
  return { organizationId, locationId: locationId ?? null };
}

export function isLocationAware(value: unknown): value is LocationAware {
  if (!value || typeof value !== 'object') return false;
  const row = value as { organizationId?: unknown; locationId?: unknown };
  return typeof row.organizationId === 'string' && row.organizationId.length > 0;
}
