/** Core schedule / booking types (core.schedules, core.services) */

export type BookingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface ServiceOffering {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  maxCapacity: number;
  category: 'private' | 'group' | 'reformer' | 'other';
  isActive: boolean;
  isSchedulable: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  staffId?: string;
  staffName?: string;
  serviceId?: string;
  serviceName?: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  memo?: string;
  createdAt?: string;
  /** 수업 완료 시 차감한 이용권 id */
  sessionPassId?: string;
}

/** 필라테스 등 횟수제 이용권 */
export type SessionPassStatus = 'active' | 'exhausted' | 'cancelled';

export interface SessionPass {
  id: string;
  customerId: string;
  customerName: string;
  label: string;
  totalSessions: number;
  usedSessions: number;
  status: SessionPassStatus;
  purchasedAt: string;
  expiresAt?: string;
  memo?: string;
}

/** 시간대 모집 수동 마감 (수업 + 강사 + 시작시각) */
export interface SlotRecruitment {
  id: string;
  serviceId: string;
  /** 강사별 슬롯. 미지정은 빈 문자열 */
  staffId: string;
  startsAt: string;
  closedManually: boolean;
}
