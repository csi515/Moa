import type { CareEnrollment, CareProgram } from '@/modules/skincare/types/careProgram';
import { STORAGE_KEYS } from '../adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from './helpers';

function computeExpiresAt(purchasedAt: string, validityDays?: number): string | undefined {
  if (!validityDays || validityDays <= 0) return undefined;
  const d = new Date(purchasedAt);
  d.setDate(d.getDate() + validityDays);
  return d.toISOString().slice(0, 10);
}

function refreshEnrollmentStatus(enrollment: CareEnrollment): CareEnrollment {
  if (enrollment.status === 'cancelled') return enrollment;
  if (enrollment.usedSessions >= enrollment.totalSessions) {
    return { ...enrollment, status: 'completed' };
  }
  if (enrollment.expiresAt && enrollment.expiresAt < new Date().toISOString().slice(0, 10)) {
    return { ...enrollment, status: 'expired' };
  }
  return { ...enrollment, status: 'active' };
}

export function createCareProgramStorage(_api: StorageApi) {
  return {
    getCarePrograms(): CareProgram[] {
      return getItem<CareProgram[]>(STORAGE_KEYS.CARE_PROGRAMS, []);
    },

    saveCareProgram(program: Omit<CareProgram, 'id'> & { id?: string }): CareProgram {
      const list = this.getCarePrograms();
      const now = new Date().toISOString();
      if (program.id) {
        const idx = list.findIndex((p) => p.id === program.id);
        const saved: CareProgram = {
          ...program,
          id: program.id,
          createdAt: list[idx]?.createdAt || now,
        };
        if (idx >= 0) list[idx] = saved;
        else list.push(saved);
        setItem(STORAGE_KEYS.CARE_PROGRAMS, list);
        return saved;
      }
      const saved: CareProgram = {
        ...program,
        id: generateEntityId('care_program'),
        createdAt: now,
      };
      list.push(saved);
      setItem(STORAGE_KEYS.CARE_PROGRAMS, list);
      return saved;
    },

    deleteCareProgram(id: string): boolean {
      const list = this.getCarePrograms();
      const filtered = list.filter((p) => p.id !== id);
      if (filtered.length === list.length) return false;
      setItem(STORAGE_KEYS.CARE_PROGRAMS, filtered);
      return true;
    },

    getCareEnrollments(): CareEnrollment[] {
      return getItem<CareEnrollment[]>(STORAGE_KEYS.CARE_ENROLLMENTS, []).map(refreshEnrollmentStatus);
    },

    getCareEnrollmentsByCustomer(customerId: string): CareEnrollment[] {
      return this.getCareEnrollments().filter((e) => e.customerId === customerId);
    },

    saveCareEnrollment(
      enrollment: Omit<CareEnrollment, 'id' | 'status'> & {
        id?: string;
        status?: CareEnrollment['status'];
      }
    ): CareEnrollment {
      const list = getItem<CareEnrollment[]>(STORAGE_KEYS.CARE_ENROLLMENTS, []);
      const now = new Date().toISOString();
      const base: CareEnrollment = {
        ...enrollment,
        id: enrollment.id || generateEntityId('care_enrollment'),
        status: enrollment.status || 'active',
        createdAt: enrollment.id
          ? list.find((e) => e.id === enrollment.id)?.createdAt || now
          : now,
      };
      const saved = refreshEnrollmentStatus(base);
      const idx = list.findIndex((e) => e.id === saved.id);
      if (idx >= 0) list[idx] = saved;
      else list.push(saved);
      setItem(STORAGE_KEYS.CARE_ENROLLMENTS, list);
      return saved;
    },

    enrollCareProgram(input: {
      customerId: string;
      customerName: string;
      programId: string;
      pricePaid?: number;
      purchasedAt?: string;
      memo?: string;
    }): CareEnrollment | null {
      const program = this.getCarePrograms().find((p) => p.id === input.programId && p.isActive);
      if (!program) return null;
      const purchasedAt = input.purchasedAt || new Date().toISOString().slice(0, 10);
      return this.saveCareEnrollment({
        customerId: input.customerId,
        customerName: input.customerName,
        programId: program.id,
        programName: program.name,
        totalSessions: program.totalSessions,
        usedSessions: 0,
        purchasedAt,
        expiresAt: computeExpiresAt(purchasedAt, program.validityDays),
        pricePaid: input.pricePaid ?? program.price,
        memo: input.memo,
      });
    },

    useCareSession(enrollmentId: string): CareEnrollment | null {
      const list = getItem<CareEnrollment[]>(STORAGE_KEYS.CARE_ENROLLMENTS, []);
      const idx = list.findIndex((e) => e.id === enrollmentId);
      if (idx < 0) return null;
      const current = refreshEnrollmentStatus(list[idx]);
      if (current.status !== 'active') return current;
      if (current.usedSessions >= current.totalSessions) {
        const completed = { ...current, status: 'completed' as const };
        list[idx] = completed;
        setItem(STORAGE_KEYS.CARE_ENROLLMENTS, list);
        return completed;
      }
      const updated = refreshEnrollmentStatus({
        ...current,
        usedSessions: current.usedSessions + 1,
      });
      list[idx] = updated;
      setItem(STORAGE_KEYS.CARE_ENROLLMENTS, list);
      return updated;
    },

    cancelCareEnrollment(id: string): CareEnrollment | null {
      const list = getItem<CareEnrollment[]>(STORAGE_KEYS.CARE_ENROLLMENTS, []);
      const idx = list.findIndex((e) => e.id === id);
      if (idx < 0) return null;
      const updated = { ...list[idx], status: 'cancelled' as const };
      list[idx] = updated;
      setItem(STORAGE_KEYS.CARE_ENROLLMENTS, list);
      return updated;
    },

    deleteCareEnrollment(id: string): boolean {
      const list = getItem<CareEnrollment[]>(STORAGE_KEYS.CARE_ENROLLMENTS, []);
      const filtered = list.filter((e) => e.id !== id);
      if (filtered.length === list.length) return false;
      setItem(STORAGE_KEYS.CARE_ENROLLMENTS, filtered);
      return true;
    },
  };
}
