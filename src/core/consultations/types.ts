import type { DayOfWeek } from '@/types';

export type ConsultationRequestStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface ConsultationDayAvailability {
  dayOfWeek: DayOfWeek;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

/** 사장이 설정하는 상담 예약 가능 시간 */
export interface ConsultationBookingSettings {
  enabled: boolean;
  slotMinutes: number;
  welcomeMessage: string;
  weeklyAvailability: ConsultationDayAvailability[];
  blockedDates: string[];
}

/** 고객 QR 상담 신청 */
export interface ConsultationBookingRequest {
  id: string;
  name: string;
  phone: string;
  content: string;
  preferredDate: string;
  preferredTime: string;
  status: ConsultationRequestStatus;
  adminMemo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BookedSlot {
  date: string;
  time: string;
}

export interface PublicConsultationBookingContext {
  organizationId: string;
  organizationName: string;
  settings: ConsultationBookingSettings;
  bookedSlots: BookedSlot[];
}

export const CONSULTATION_REQUEST_STATUS_LABELS: Record<ConsultationRequestStatus, string> = {
  pending: '접수',
  confirmed: '확정',
  completed: '완료',
  cancelled: '취소',
};

export const DEFAULT_CONSULTATION_BOOKING_SETTINGS: ConsultationBookingSettings = {
  enabled: false,
  slotMinutes: 30,
  welcomeMessage: '상담을 원하시면 아래에서 날짜와 시간을 선택해 주세요.',
  weeklyAvailability: (
    ['월', '화', '수', '목', '금', '토', '일'] as DayOfWeek[]
  ).map((dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek !== '일',
    startTime: '10:00',
    endTime: '18:00',
  })),
  blockedDates: [],
};
