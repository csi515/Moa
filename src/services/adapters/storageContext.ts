let organizationId: string | null = null;

export function getOrganizationId(): string | null {
  return organizationId;
}

export function setOrganizationId(id: string | null): void {
  organizationId = id;
}

/** org 스코프 localStorage 키 생성 */
export function resolveStorageKey(baseKey: string): string {
  if (organizationId) {
    return `${baseKey}_${organizationId}`;
  }
  return baseKey;
}
