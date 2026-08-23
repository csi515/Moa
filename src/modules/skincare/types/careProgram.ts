/** 1인 피부샵 케어 프로그램(회차권) 타입 */

export type CareEnrollmentStatus = 'active' | 'completed' | 'expired' | 'cancelled';

export interface CareProgram {
  id: string;
  name: string;
  description?: string;
  totalSessions: number;
  price: number;
  /** 구매일 기준 유효 일수 (미설정 시 무기한) */
  validityDays?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CareEnrollment {
  id: string;
  customerId: string;
  customerName: string;
  programId: string;
  programName: string;
  totalSessions: number;
  usedSessions: number;
  purchasedAt: string;
  expiresAt?: string;
  status: CareEnrollmentStatus;
  pricePaid: number;
  memo?: string;
  createdAt?: string;
}
