const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export function ensureUuid(id: string | undefined): string {
  if (id && isValidUuid(id)) return id;
  return crypto.randomUUID();
}

/** upsert/delete 동기화용 ID 집합 diff */
export function diffIds(existingIds: string[], currentIds: string[]): string[] {
  const current = new Set(currentIds);
  return existingIds.filter((id) => !current.has(id));
}
