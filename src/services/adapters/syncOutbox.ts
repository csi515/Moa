/**
 * Sync outbox — remote persist 재시도 대기열.
 *
 * localStorage(`moa:sync-outbox:{orgId}`)에 저장되지만
 * 업무 엔티티(학생·교재·청구 등) 자체가 아니다.
 * debounced Supabase persist가 실패한 StorageKey 목록만 담아
 * online/visibility 시 flushPersist로 재시도한다.
 *
 * = pending sync / remote persistence retry state (cache가 아님, SoT도 아님)
 */
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

/** remote persist 실패 키를 org 스코프 outbox에 적재 (업무 데이터 저장 아님) */
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
