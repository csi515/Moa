import { STORAGE_KEYS } from '@/services/adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from '@/services/storage/helpers';
import type { CareJournal, MedicationRequest } from './types';

/** 어린이집 알림장·투약 localStorage CRUD */
export function createDaycareCareStorage(_api: StorageApi) {
  return {
    getCareJournals(): CareJournal[] {
      return getItem<CareJournal[]>(STORAGE_KEYS.CARE_JOURNALS, []);
    },

    saveCareJournal(
      input: Omit<CareJournal, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ): CareJournal {
      const list = getItem<CareJournal[]>(STORAGE_KEYS.CARE_JOURNALS, []);
      const now = new Date().toISOString();
      let saved: CareJournal;

      if (input.id) {
        const idx = list.findIndex((j) => j.id === input.id);
        if (idx >= 0) {
          saved = { ...list[idx], ...input, id: input.id, updatedAt: now };
          list[idx] = saved;
        } else {
          saved = { ...input, id: input.id, createdAt: now, updatedAt: now };
          list.unshift(saved);
        }
      } else {
        saved = {
          ...input,
          id: generateEntityId('cj'),
          createdAt: now,
          updatedAt: now,
        };
        list.unshift(saved);
      }

      setItem(STORAGE_KEYS.CARE_JOURNALS, list);
      return saved;
    },

    deleteCareJournal(id: string): boolean {
      const list = getItem<CareJournal[]>(STORAGE_KEYS.CARE_JOURNALS, []);
      const filtered = list.filter((j) => j.id !== id);
      if (filtered.length === list.length) return false;
      setItem(STORAGE_KEYS.CARE_JOURNALS, filtered);
      return true;
    },

    getMedicationRequests(): MedicationRequest[] {
      return getItem<MedicationRequest[]>(STORAGE_KEYS.MEDICATION_REQUESTS, []);
    },

    saveMedicationRequest(
      input: Omit<MedicationRequest, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ): MedicationRequest {
      const list = getItem<MedicationRequest[]>(STORAGE_KEYS.MEDICATION_REQUESTS, []);
      const now = new Date().toISOString();
      let saved: MedicationRequest;

      if (input.id) {
        const idx = list.findIndex((m) => m.id === input.id);
        if (idx >= 0) {
          saved = { ...list[idx], ...input, id: input.id, updatedAt: now };
          list[idx] = saved;
        } else {
          saved = { ...input, id: input.id, createdAt: now, updatedAt: now };
          list.unshift(saved);
        }
      } else {
        saved = {
          ...input,
          id: generateEntityId('med'),
          createdAt: now,
          updatedAt: now,
        };
        list.unshift(saved);
      }

      setItem(STORAGE_KEYS.MEDICATION_REQUESTS, list);
      return saved;
    },

    deleteMedicationRequest(id: string): boolean {
      const list = getItem<MedicationRequest[]>(STORAGE_KEYS.MEDICATION_REQUESTS, []);
      const filtered = list.filter((m) => m.id !== id);
      if (filtered.length === list.length) return false;
      setItem(STORAGE_KEYS.MEDICATION_REQUESTS, filtered);
      return true;
    },
  };
}
