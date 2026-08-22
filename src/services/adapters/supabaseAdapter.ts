import { readLocal, removeLocal, writeLocal } from './localStorageEngine';
import { getOrganizationId, setIndustryType, setOrganizationId } from './storageContext';
import {
  CORE_SYNC_KEYS,
  PIANO_SYNC_KEYS,
  STORAGE_KEYS,
  SUPABASE_SYNC_KEYS,
  type StorageKey,
} from './storageKeys';
import { hydrateCoreEntities, persistCoreEntity } from './sync/coreEntitySync';
import { hydratePianoEntities, persistPianoEntity } from './sync/pianoEntitySync';
import type { IStorageAdapter, StorageListener } from './types';

/** Supabase 하이브리드 어댑터 — Core + Piano 모듈 Supabase sync */
export class SupabaseAdapter implements IStorageAdapter {
  readonly backend = 'supabase' as const;

  private listeners = new Set<StorageListener>();
  private cache = new Map<string, unknown>();
  private hydrated = false;
  private hydrating = false;
  private persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

  getItem<T>(key: StorageKey, defaultValue: T): T {
    if (SUPABASE_SYNC_KEYS.has(key) && this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    return readLocal(key, defaultValue);
  }

  setItem<T>(key: StorageKey, value: T): void {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      this.cache.set(key, value);
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
    if (this.hydrating) return;

    setOrganizationId(organizationId);
    setIndustryType(industryType ?? null);
    this.hydrating = true;
    this.hydrated = false;

    const cacheAdapter = this.createCacheAdapter();

    try {
      await hydrateCoreEntities(organizationId, cacheAdapter, industryType);
      await hydratePianoEntities(organizationId, cacheAdapter);
      this.hydrated = true;
      this.notify();
    } finally {
      this.hydrating = false;
    }
  }

  clearOrganization(): void {
    this.cache.clear();
    this.hydrated = false;
    this.persistTimers.forEach((timer) => clearTimeout(timer));
    this.persistTimers.clear();
    setOrganizationId(null);
    setIndustryType(null);
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  isHydrating(): boolean {
    return this.hydrating;
  }

  private createCacheAdapter() {
    return {
      get: <T>(key: StorageKey) => this.cache.get(key) as T | undefined,
      set: <T>(key: StorageKey, value: T) => this.cache.set(key, value),
      delete: (key: StorageKey) => this.cache.delete(key),
    };
  }

  private schedulePersist(key: StorageKey): void {
    const existing = this.persistTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.persistTimers.delete(key);
      void this.persistKey(key);
    }, 300);

    this.persistTimers.set(key, timer);
  }

  private async persistKey(key: StorageKey): Promise<void> {
    const orgId = getOrganizationId();
    if (!orgId) return;

    const cacheAdapter = this.createCacheAdapter();

    if (CORE_SYNC_KEYS.has(key)) {
      await persistCoreEntity(key, orgId, cacheAdapter);
    }

    if (PIANO_SYNC_KEYS.has(key)) {
      await persistPianoEntity(key, orgId, cacheAdapter);
    }
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
