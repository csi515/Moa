import type { AcademySettings, Teacher } from '../../types';
import { getCoreClient } from '../../lib/supabase';
import type { Json } from '../../lib/supabase/database.types';
import { readLocal, removeLocal, writeLocal } from './localStorageEngine';
import { parseOrganizationSettings, staffRowToTeacher, teacherToStaffRow } from './mappers';
import { getOrganizationId, setOrganizationId } from './storageContext';
import { STORAGE_KEYS, SUPABASE_SYNC_KEYS } from './storageKeys';
import type { IStorageAdapter, StorageListener } from './types';

/** Supabase 하이브리드 어댑터 — Core 엔티티는 Supabase, 나머지는 org-scoped localStorage */
export class SupabaseAdapter implements IStorageAdapter {
  readonly backend = 'supabase' as const;

  private listeners = new Set<StorageListener>();
  private cache = new Map<string, unknown>();
  private hydrated = false;
  private hydrating = false;
  private persistTimers = new Map<string, ReturnType<typeof setTimeout>>();

  getItem<T>(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], defaultValue: T): T {
    if (SUPABASE_SYNC_KEYS.has(key) && this.cache.has(key)) {
      return this.cache.get(key) as T;
    }
    return readLocal(key, defaultValue);
  }

  setItem<T>(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], value: T): void {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      this.cache.set(key, value);
      this.schedulePersist(key);
    } else {
      writeLocal(key, value);
    }
    this.notify();
  }

  removeItem(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]): void {
    if (SUPABASE_SYNC_KEYS.has(key)) {
      this.cache.delete(key);
    } else {
      removeLocal(key);
    }
    this.notify();
  }

  subscribe(listener: StorageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async hydrate(organizationId: string): Promise<void> {
    if (this.hydrating) return;

    setOrganizationId(organizationId);
    this.hydrating = true;
    this.hydrated = false;

    try {
      const client = getCoreClient();

      const [orgResult, staffResult] = await Promise.all([
        client.from('organizations').select('settings, name').eq('id', organizationId).single(),
        client.from('staff').select('*').eq('organization_id', organizationId),
      ]);

      if (orgResult.error) {
        console.error('Failed to load organization settings:', orgResult.error);
      }

      if (staffResult.error) {
        console.error('Failed to load staff:', staffResult.error);
      }

      const defaultSettings = readLocal<AcademySettings>(STORAGE_KEYS.SETTINGS, {
        name: orgResult.data?.name || '',
        address: '',
        phone: '',
        defaultTuitionFee: 180000,
      });

      const settings = parseOrganizationSettings(orgResult.data?.settings, defaultSettings);
      if (!settings.name && orgResult.data?.name) {
        settings.name = orgResult.data.name;
      }

      const teachers = (staffResult.data || []).map(staffRowToTeacher);

      this.cache.set(STORAGE_KEYS.SETTINGS, settings);
      this.cache.set(STORAGE_KEYS.TEACHERS, teachers);

      writeLocal(STORAGE_KEYS.SETTINGS, settings);
      writeLocal(STORAGE_KEYS.TEACHERS, teachers);

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
  }

  isHydrated(): boolean {
    return this.hydrated;
  }

  isHydrating(): boolean {
    return this.hydrating;
  }

  private schedulePersist(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]): void {
    const existing = this.persistTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.persistTimers.delete(key);
      void this.persistKey(key);
    }, 300);

    this.persistTimers.set(key, timer);
  }

  private async persistKey(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]): Promise<void> {
    const orgId = getOrganizationId();
    if (!orgId) return;

    try {
      const client = getCoreClient();

      if (key === STORAGE_KEYS.SETTINGS) {
        const settings = this.cache.get(key) as AcademySettings | undefined;
        if (!settings) return;

        const { error } = await client
          .from('organizations')
          .update({ settings: settings as unknown as Json })
          .eq('id', orgId);

        if (error) console.error('Failed to persist settings:', error);
        writeLocal(STORAGE_KEYS.SETTINGS, settings);
        return;
      }

      if (key === STORAGE_KEYS.TEACHERS) {
        const teachers = (this.cache.get(key) as Teacher[] | undefined) || [];
        const { data: existing, error: fetchError } = await client
          .from('staff')
          .select('id')
          .eq('organization_id', orgId);

        if (fetchError) {
          console.error('Failed to fetch staff for sync:', fetchError);
          return;
        }

        const existingIds = new Set((existing || []).map((r) => r.id));
        const currentIds = new Set(teachers.map((t) => t.id));

        const toDelete = [...existingIds].filter((id) => !currentIds.has(id));
        if (toDelete.length > 0) {
          const { error } = await client.from('staff').delete().in('id', toDelete);
          if (error) console.error('Failed to delete staff:', error);
        }

        for (const teacher of teachers) {
          const row = teacherToStaffRow(teacher, orgId);
          const { error } = await client.from('staff').upsert(row);
          if (error) console.error('Failed to upsert staff:', error);
        }

        writeLocal(STORAGE_KEYS.TEACHERS, teachers);
      }
    } catch (e) {
      console.error(`Persist failed for ${key}:`, e);
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
