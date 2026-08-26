import { STORAGE_KEYS } from '@/services/adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from '@/services/storage/helpers';
import type { CareJournal, MedicationRequest } from './types';

function upsertById<T extends { id: string; createdAt?: string; updatedAt?: string }>(
  list: T[],
  input: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
  },
  idPrefix: string
): { list: T[]; saved: T } {
  const now = new Date().toISOString();
  let saved: T;

  if (input.id) {
    const idx = list.findIndex((item) => item.id === input.id);
    if (idx >= 0) {
      saved = { ...list[idx], ...input, id: input.id, updatedAt: now };
      list[idx] = saved;
    } else {
      saved = { ...(input as T), id: input.id, createdAt: now, updatedAt: now };
      list.unshift(saved);
    }
  } else {
    saved = {
      ...(input as T),
      id: generateEntityId(idPrefix),
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(saved);
  }

  return { list, saved };
}

function deleteById<T extends { id: string }>(list: T[], id: string): T[] | null {
  const filtered = list.filter((item) => item.id !== id);
  return filtered.length === list.length ? null : filtered;
}

/** 어린이집 알림장·투약 localStorage CRUD */
export function createDaycareCareStorage(_api: StorageApi) {
  return {
    getCareJournals(): CareJournal[] {
      return getItem<CareJournal[]>(STORAGE_KEYS.CARE_JOURNALS, []);
    },

    saveCareJournal(
      input: Omit<CareJournal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ): CareJournal {
      const current = getItem<CareJournal[]>(STORAGE_KEYS.CARE_JOURNALS, []);
      const { list, saved } = upsertById(current, input, 'cj');
      setItem(STORAGE_KEYS.CARE_JOURNALS, list);
      return saved;
    },

    deleteCareJournal(id: string): boolean {
      const current = getItem<CareJournal[]>(STORAGE_KEYS.CARE_JOURNALS, []);
      const next = deleteById(current, id);
      if (!next) return false;
      setItem(STORAGE_KEYS.CARE_JOURNALS, next);
      return true;
    },

    getMedicationRequests(): MedicationRequest[] {
      return getItem<MedicationRequest[]>(STORAGE_KEYS.MEDICATION_REQUESTS, []);
    },

    saveMedicationRequest(
      input: Omit<MedicationRequest, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ): MedicationRequest {
      const current = getItem<MedicationRequest[]>(STORAGE_KEYS.MEDICATION_REQUESTS, []);
      const { list, saved } = upsertById(current, input, 'med');
      setItem(STORAGE_KEYS.MEDICATION_REQUESTS, list);
      return saved;
    },

    deleteMedicationRequest(id: string): boolean {
      const current = getItem<MedicationRequest[]>(STORAGE_KEYS.MEDICATION_REQUESTS, []);
      const next = deleteById(current, id);
      if (!next) return false;
      setItem(STORAGE_KEYS.MEDICATION_REQUESTS, next);
      return true;
    },
  };
}
