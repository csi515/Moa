import { readLocal, removeLocal, writeLocal } from './localStorageEngine';
import { getOrganizationId, setIndustryType, setOrganizationId } from './storageContext';
import { normalizeIndustryType } from '../../core/industry/types';
import {
  CORE_SYNC_KEYS,
  DAYCARE_SYNC_KEYS,
  PIANO_SYNC_KEYS,
  STORAGE_KEYS,
  SUPABASE_SYNC_KEYS,
  type StorageKey,
} from './storageKeys';
import { hydrateCoreEntities, persistCoreEntity, type SyncCache } from './sync/coreEntitySync';
import { hydrateDaycareEntities, persistDaycareEntity } from './sync/daycareEntitySync';
import { hydrateEducationEntities, persistEducationEntity } from './sync/educationEntitySync';
import { hydratePianoEntities, persistPianoEntity } from './sync/pianoEntitySync';
import {
  clearSyncOutboxKeys,
  enqueueSyncOutbox,
  peekSyncOutbox,
} from './syncOutbox';
import type { IStorageAdapter, StorageListener } from './types';

const LOCAL_MISS = Symbol('local-miss');

/** Supabase 하이브리드 어댑터 — Core + Piano 모듈 Supabase sync */
export class SupabaseAdapter implements IStorageAdapter {
  readonly backend = 'supabase' as const;

  private listeners = new Set<StorageListener>();
  private cache = new Map<string, unknown>();
  private hydrated = false;
  private hydrating = false;
  /** 네트워크 hydrate 실패 후 로컬 스냅샷으로 기동 */
  private offlineHydrated = false;
  /** hydrate / clear 시 증가 — in-flight hydrate·persist 무효화 */
  private hydrateGeneration = 0;
  private persistGeneration = 0;
  private persistTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private onlineListenerAttached = false;

  getItem<T>(key: StorageKey, defaultValue: T): T {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      if (this.cache.has(key)) {
        return this.cache.get(key) as T;
      }
      // hydrate 완료 전: org 스코프 로컬 스냅샷만 허용 (오프라인 폴백)
      if (getOrganizationId() && !this.hydrated) {
        if (this.offlineHydrated) {
          return readLocal(key, defaultValue);
        }
        return defaultValue;
      }
    }
    return readLocal(key, defaultValue);
  }

  setItem<T>(key: StorageKey, value: T): void {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      this.cache.set(key, value);
      // 오프라인·재시작 대비 즉시 로컬 미러
      writeLocal(key, value);
      this.schedulePersist(key);
    } else {
      writeLocal(key, value);
    }
    this.notify();
  }

  removeItem(key: StorageKey): void {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      this.cache.delete(key);
      this.schedulePersist(key);
    } else {
      removeLocal(key);
    }
    this.notify();
  }

  subscribe(listener: StorageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async hydrate(organizationId: string, industryType?: string | null): Promise<void> {
    const generation = ++this.hydrateGeneration;
    this.persistGeneration++;

    setOrganizationId(organizationId);
    setIndustryType(industryType ?? null);
    this.cache.clear();
    this.persistTimers.forEach((timer) => clearTimeout(timer));
    this.persistTimers.clear();
    this.hydrated = false;
    this.offlineHydrated = false;
    this.hydrating = true;

    const cacheAdapter = this.createLiveCacheAdapter();
    const isStale = () => generation !== this.hydrateGeneration;

    try {
      await hydrateCoreEntities(organizationId, cacheAdapter, industryType);
      if (isStale()) return;

      await hydratePianoEntities(organizationId, cacheAdapter);
      if (isStale()) return;

      await hydrateEducationEntities(organizationId, cacheAdapter);
      if (isStale()) return;

      if (normalizeIndustryType(industryType) === 'daycare') {
        await hydrateDaycareEntities(organizationId, cacheAdapter);
        if (isStale()) return;
      }

      this.hydrated = true;
      this.offlineHydrated = false;
      this.ensureOnlineFlushListener();
      this.notify();
      void this.flushSyncOutbox();
    } catch (error) {
      if (!isStale()) {
        const loaded = this.loadLocalSnapshotIntoCache();
        if (loaded) {
          this.hydrated = true;
          this.offlineHydrated = true;
          this.ensureOnlineFlushListener();
          this.notify();
          console.warn('[storage] hydrate failed — using local snapshot (offline mode)', error);
          return;
        }
        this.hydrated = false;
        this.offlineHydrated = false;
        this.cache.clear();
      }
      throw error;
    } finally {
      if (!isStale()) {
        this.hydrating = false;
      }
    }
  }

  clearOrganization(): void {
    // in-flight hydrate/persist 무효화
    this.hydrateGeneration++;
    this.persistGeneration++;
    this.cache.clear();
    this.hydrated = false;
    this.offlineHydrated = false;
    this.hydrating = false;
    this.persistTimers.forEach((timer) => clearTimeout(timer));
    this.persistTimers.clear();
    setOrganizationId(null);
    setIndustryType(null);
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  isOfflineHydrated(): boolean {
    return this.offlineHydrated;
  }

  isHydrating(): boolean {
    return this.hydrating;
  }

  async flushPersist(keys: StorageKey[]): Promise<boolean> {
    let ok = true;
    for (const key of keys) {
      const existing = this.persistTimers.get(key);
      if (existing) {
        clearTimeout(existing);
        this.persistTimers.delete(key);
      }
      const keyOk = await this.persistKey(key);
      if (!keyOk) ok = false;
    }
    return ok;
  }

  /** hydrate용 — live cache */
  private createLiveCacheAdapter(): SyncCache {
    return {
      get: <T>(key: StorageKey) => this.cache.get(key) as T | undefined,
      set: <T>(key: StorageKey, value: T) => {
        this.cache.set(key, value);
      },
      delete: (key: StorageKey) => {
        this.cache.delete(key);
      },
      has: (key: StorageKey) => this.cache.has(key),
    };
  }

  /**
   * persist용 — schedule 시점 스냅샷.
   * clear/hydrate 후 live cache가 비어도 빈 목록으로 원격 DELETE하지 않도록 함.
   * 다만 generation/org 가드가 1차 방어.
   */
  private createSnapshotCacheAdapter(snapshot: Map<string, unknown>): SyncCache {
    return {
      get: <T>(key: StorageKey) => snapshot.get(key) as T | undefined,
      set: () => {
        /* persist 경로에서 cache 갱신 금지 */
      },
      delete: () => {
        /* no-op */
      },
      has: (key: StorageKey) => snapshot.has(key),
    };
  }

  private schedulePersist(key: StorageKey): void {
    if (!this.hydrated) return;

    const existing = this.persistTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.persistTimers.delete(key);
      void this.persistKey(key);
    }, 300);

    this.persistTimers.set(key, timer);
  }

  private isPersistValid(generation: number, orgId: string): boolean {
    return (
      generation === this.persistGeneration &&
      this.hydrated &&
      getOrganizationId() === orgId
    );
  }

  private async persistKey(key: StorageKey): Promise<boolean> {
    if (!this.hydrated) return false;

    const generation = this.persistGeneration;
    const orgId = getOrganizationId();
    if (!orgId) return false;

    // 시작 시점 스냅샷 + 가드 (in-flight 중 clear/org 전환 시 중단)
    const snapshot = new Map(this.cache);
    const cacheAdapter = this.createSnapshotCacheAdapter(snapshot);
    const isAborted = () => !this.isPersistValid(generation, orgId);

    if (isAborted()) return false;

    try {
      let ok = true;

      if (CORE_SYNC_KEYS.has(key)) {
        ok = (await persistCoreEntity(key, orgId, cacheAdapter, isAborted)) && ok;
        if (isAborted()) return false;
      }

      if (PIANO_SYNC_KEYS.has(key)) {
        await persistPianoEntity(key, orgId, cacheAdapter, isAborted);
        if (isAborted()) return false;
        await persistEducationEntity(key, orgId, cacheAdapter, isAborted);
        if (isAborted()) return false;
      }

      if (DAYCARE_SYNC_KEYS.has(key)) {
        await persistDaycareEntity(key, orgId, cacheAdapter, isAborted);
        if (isAborted()) return false;
      }

      if (!ok) {
        enqueueSyncOutbox(key);
      } else {
        clearSyncOutboxKeys([key]);
      }

      return ok;
    } catch (error) {
      console.error(`[storage] persist failed for ${key}`, error);
      enqueueSyncOutbox(key);
      return false;
    }
  }

  /** 로컬에 저장된 org 스냅샷을 캐시에 적재 (오프라인 기동) */
  private loadLocalSnapshotIntoCache(): boolean {
    let loaded = 0;
    for (const key of SUPABASE_SYNC_KEYS) {
      const value = readLocal<unknown | typeof LOCAL_MISS>(key, LOCAL_MISS);
      if (value !== LOCAL_MISS) {
        this.cache.set(key, value);
        loaded++;
      }
    }
    return (
      this.cache.has(STORAGE_KEYS.STUDENTS) ||
      this.cache.has(STORAGE_KEYS.SETTINGS) ||
      loaded >= 3
    );
  }

  private ensureOnlineFlushListener(): void {
    if (this.onlineListenerAttached || typeof window === 'undefined') return;
    this.onlineListenerAttached = true;
    const flush = () => {
      void this.flushSyncOutbox();
    };
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') flush();
    });
  }

  async flushSyncOutbox(): Promise<void> {
    if (!this.hydrated || typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }
    const keys = peekSyncOutbox();
    if (keys.length === 0) return;
    const ok = await this.flushPersist(keys);
    if (ok) clearSyncOutboxKeys(keys);
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Storage listener error:', e);
      }
    });
  }
}
