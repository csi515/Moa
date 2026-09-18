import type { StorageKey } from './storageKeys';
import { getOrganizationId } from './storageContext';
import { readLocalRaw, writeLocalRaw } from './localStorageEngine';

const OUTBOX_PREFIX = 'moa:sync-outbox:';

function outboxKey(orgId: string): string {
  return `${OUTBOX_PREFIX}${orgId}`;
}

function readOutbox(orgId: string): StorageKey[] {
  try {
    const raw = readLocalRaw(outboxKey(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? (parsed as StorageKey[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(orgId: string, keys: StorageKey[]): void {
  writeLocalRaw(outboxKey(orgId), JSON.stringify([...new Set(keys)]));
}

/** persist 실패 키를 org 스코프 outbox에 적재 */
export function enqueueSyncOutbox(key: StorageKey): void {
  const orgId = getOrganizationId();
  if (!orgId) return;
  const next = readOutbox(orgId);
  if (!next.includes(key)) next.push(key);
  writeOutbox(orgId, next);
}

export function peekSyncOutbox(): StorageKey[] {
  const orgId = getOrganizationId();
  if (!orgId) return [];
  return readOutbox(orgId);
}

export function clearSyncOutboxKeys(keys: StorageKey[]): void {
  const orgId = getOrganizationId();
  if (!orgId) return;
  const remaining = readOutbox(orgId).filter((k) => !keys.includes(k));
  writeOutbox(orgId, remaining);
}

export function hasPendingSyncOutbox(): boolean {
  return peekSyncOutbox().length > 0;
}
