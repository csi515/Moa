import { StorageService } from '@/services/storage';
import type { CareEnrollment, CareProgram } from '../types/careProgram';

/** 피부샵 케어 프로그램 도메인 서비스 */
export const CareProgramService = {
  getPrograms(): CareProgram[] {
    return StorageService.getCarePrograms();
  },

  getActivePrograms(): CareProgram[] {
    return StorageService.getCarePrograms().filter((p) => p.isActive);
  },

  saveProgram(program: Omit<CareProgram, 'id'> & { id?: string }): CareProgram {
    return StorageService.saveCareProgram(program);
  },

  deleteProgram(id: string): boolean {
    return StorageService.deleteCareProgram(id);
  },

  getEnrollments(): CareEnrollment[] {
    return StorageService.getCareEnrollments();
  },

  getEnrollmentsByCustomer(customerId: string): CareEnrollment[] {
    return StorageService.getCareEnrollmentsByCustomer(customerId);
  },

  getActiveEnrollments(): CareEnrollment[] {
    return StorageService.getCareEnrollments().filter((e) => e.status === 'active');
  },

  enroll(input: {
    customerId: string;
    customerName: string;
    programId: string;
    pricePaid?: number;
    purchasedAt?: string;
    memo?: string;
  }): CareEnrollment | null {
    return StorageService.enrollCareProgram(input);
  },

  useSession(enrollmentId: string): CareEnrollment | null {
    return StorageService.useCareSession(enrollmentId);
  },

  cancelEnrollment(id: string): CareEnrollment | null {
    return StorageService.cancelCareEnrollment(id);
  },

  deleteEnrollment(id: string): boolean {
    return StorageService.deleteCareEnrollment(id);
  },
};
