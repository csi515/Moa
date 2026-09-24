/**
 * org 스코프 pending mutation.
 * localStorage 목록은 payload, 이 모듈은 dirty key / tombstone / conflict 만 기록.
 */
import type { StorageKey } from './storageKeys';
import { getOrganizationId } from './storageContext';
import { readLocal, readLocalRaw, writeLocalRaw } from './localStorageEngine';

export type PendingMutationKind = 'upsert' | 'delete';

export type PendingMutationRecord = {
  key: StorageKey;
  kind: PendingMutationKind;
  entityId?: string;
  updatedAt: string;
  conflict?: boolean;
};

type PendingStore = {
  mutations: PendingMutationRecord[];
};

const PREFIX = 'moa:pending-mutations:';

function storeKey(orgId: string): string {
  return `${PREFIX}${orgId}`;
}

function emptyStore(): PendingStore {
  return { mutations: [] };
}

function readStore(orgId: string): PendingStore {
  try {
    const raw = readLocalRaw(storeKey(orgId));
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as PendingStore;
    return Array.isArray(parsed?.mutations) ? parsed : emptyStore();
  } catch {
    return emptyStore();
  }
}

function writeStore(orgId: string, store: PendingStore): void {
  writeLocalRaw(storeKey(orgId), JSON.stringify(store));
}

function currentOrg(): string | null {
  return getOrganizationId();
}

export function markPendingUpsert(key: StorageKey, entityId?: string): void {
  const orgId = currentOrg();
  if (!orgId) return;
  const store = readStore(orgId);
  store.mutations = store.mutations.filter(
    (m) => !(m.key === key && m.kind === 'upsert' && m.entityId === entityId)
  );
  store.mutations.push({
    key,
    kind: 'upsert',
    entityId,
    updatedAt: new Date().toISOString(),
  });
  writeStore(orgId, store);
}

export function markPendingDelete(key: StorageKey, entityId: string): void {
  const orgId = currentOrg();
  if (!orgId) return;
  const store = readStore(orgId);
  store.mutations = store.mutations.filter(
    (m) => !(m.key === key && m.entityId === entityId)
  );
  store.mutations.push({
    key,
    kind: 'delete',
    entityId,
    updatedAt: new Date().toISOString(),
  });
  writeStore(orgId, store);
}

export function peekPendingMutations(orgId?: string | null): PendingMutationRecord[] {
  const id = orgId ?? currentOrg();
  if (!id) return [];
  return readStore(id).mutations;
}

export function hasPendingForKey(key: StorageKey, orgId?: string | null): boolean {
  return peekPendingMutations(orgId).some((m) => m.key === key);
}

export function pendingDeleteIds(key: StorageKey, orgId?: string | null): string[] {
  return peekPendingMutations(orgId)
    .filter((m) => m.key === key && m.kind === 'delete' && m.entityId)
    .map((m) => m.entityId as string);
}

export function clearPendingForKey(key: StorageKey): void {
  const orgId = currentOrg();
  if (!orgId) return;
  const store = readStore(orgId);
  store.mutations = store.mutations.filter((m) => m.key !== key);
  writeStore(orgId, store);
}

export function markPendingConflict(key: StorageKey, entityId?: string): void {
  const orgId = currentOrg();
  if (!orgId) return;
  const store = readStore(orgId);
  let touched = false;
  store.mutations = store.mutations.map((m) => {
    if (m.key !== key) return m;
    if (entityId && m.entityId !== entityId) return m;
    touched = true;
    return { ...m, conflict: true };
  });
  if (!touched) {
    store.mutations.push({
      key,
      kind: 'upsert',
      entityId,
      updatedAt: new Date().toISOString(),
      conflict: true,
    });
  }
  writeStore(orgId, store);
}

export function hasPendingConflicts(orgId?: string | null): boolean {
  return peekPendingMutations(orgId).some((m) => m.conflict);
}

/** hydrate 시 dirty 목록과 remote를 id 기준으로 합친다. remote-only 행은 유지. */
export function mergeEntityListsById<T extends { id: string }>(params: {
  remote: T[];
  local: T[];
  pendingDeleteIds?: string[];
}): { merged: T[]; conflictIds: string[] } {
  const deleted = new Set(params.pendingDeleteIds ?? []);
  const localById = new Map(params.local.map((row) => [row.id, row]));
  const remoteById = new Map(params.remote.map((row) => [row.id, row]));
  const conflictIds: string[] = [];
  const merged: T[] = [];

  for (const [id, remoteRow] of remoteById) {
    if (deleted.has(id)) continue;
    const localRow = localById.get(id);
    if (!localRow) {
      merged.push(remoteRow);
      continue;
    }
    if (JSON.stringify(localRow) !== JSON.stringify(remoteRow)) {
      conflictIds.push(id);
      merged.push(localRow);
    } else {
      merged.push(remoteRow);
    }
    localById.delete(id);
  }

  for (const [id, localRow] of localById) {
    if (deleted.has(id)) continue;
    merged.push(localRow);
  }

  return { merged, conflictIds };
}

/** hydrate 직후: dirty key면 remote snapshot으로 덮지 않고 merge */
export function applyDirtyListMerge<T extends { id: string }>(
  key: StorageKey,
  remote: T[]
): T[] {
  if (!hasPendingForKey(key)) return remote;
  const local = readLocal<T[]>(key, []);
  const { merged, conflictIds } = mergeEntityListsById({
    remote,
    local,
    pendingDeleteIds: pendingDeleteIds(key),
  });
  for (const id of conflictIds) markPendingConflict(key, id);
  return merged;
}
