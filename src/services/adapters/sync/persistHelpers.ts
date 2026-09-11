import type { StorageKey } from '../storageKeys';
import type { PersistAbortGuard, SyncCache } from './syncTypes';
import { assertHydrateNoErrors, safeDiffIds } from './utils';

export function logHydrateErrors(errors: Record<string, unknown>): void {
  for (const [key, err] of Object.entries(errors)) {
    if (err) console.error(`Failed to load ${key}:`, err);
  }
}

/** hydrate fetch 오류 로그 후 불완전 캐시 기록 금지 */
export function checkHydrateErrors(
  errors: Record<string, unknown>,
  context: string
): void {
  logHydrateErrors(errors);
  assertHydrateNoErrors(errors, context);
}

/** 캐시 키 누락 시 null — diff-delete 금지용 */
export function requireCacheList<T>(
  cache: SyncCache,
  key: StorageKey,
  context: string
): T[] | null {
  if (!cache.has(key)) {
    console.error(`[sync] Refusing ${context} persist: cache key missing`);
    return null;
  }
  return cache.get<T[]>(key) || [];
}

/**
 * upsert 후 ID diff-delete.
 * 캐시 불완전·abort 시 삭제 생략.
 */
export async function upsertThenDiffDelete(params: {
  context: string;
  cachePresent: boolean;
  currentIds: string[];
  isAborted?: PersistAbortGuard;
  upsertAll: () => Promise<void>;
  fetchRemoteIds: () => Promise<{ ids: string[]; error: unknown }>;
  deleteIds: (ids: string[]) => Promise<{ error: unknown }>;
}): Promise<boolean> {
  if (params.isAborted?.()) return false;

  await params.upsertAll();
  if (params.isAborted?.()) return false;

  const { ids, error } = await params.fetchRemoteIds();
  if (error) {
    console.error(`Failed to fetch ${params.context} for sync:`, error);
    return false;
  }
  if (params.isAborted?.()) return false;

  const toDelete = safeDiffIds(ids, params.currentIds, {
    cachePresent: params.cachePresent,
    context: params.context,
  });
  if (toDelete.length === 0) return true;

  const { error: deleteError } = await params.deleteIds(toDelete);
  if (deleteError) {
    console.error(`Failed to delete from ${params.context}:`, deleteError);
    return false;
  }
  return true;
}

/**
 * composite-key upsert 후 keyed delete (wipe-all 금지).
 * key 형식은 호출측 정의 (예: parentId:studentId).
 */
export async function upsertThenDiffDeleteByKeys(params: {
  context: string;
  cachePresent: boolean;
  currentKeys: string[];
  isAborted?: PersistAbortGuard;
  upsertAll: () => Promise<void>;
  fetchRemoteKeys: () => Promise<{ keys: string[]; error: unknown }>;
  deleteKey: (key: string) => Promise<{ error: unknown }>;
}): Promise<boolean> {
  if (params.isAborted?.()) return false;

  await params.upsertAll();
  if (params.isAborted?.()) return false;

  const { keys, error } = await params.fetchRemoteKeys();
  if (error) {
    console.error(`Failed to fetch ${params.context} for sync:`, error);
    return false;
  }
  if (params.isAborted?.()) return false;

  const toDelete = safeDiffIds(keys, params.currentKeys, {
    cachePresent: params.cachePresent,
    context: params.context,
  });

  let ok = true;
  for (const key of toDelete) {
    if (params.isAborted?.()) return false;
    const { error: deleteError } = await params.deleteKey(key);
    if (deleteError) {
      ok = false;
      console.error(`Failed to delete ${params.context} key ${key}:`, deleteError);
    }
  }
  return ok;
}
