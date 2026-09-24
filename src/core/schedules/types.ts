/**
 * Core Schedule & Reservation Types
 *
 * - CoreSchedule: 슬롯/운영 일정 (core.schedules)
 * - Reservation*: bookable 슬롯 신청 (core.reservations)
 * - Booking 타입은 ../types/schedule.ts — 같은 schedules 행을 예약 행위로 재사용
 */
export type {
  CoreSchedule,
  BookableSchedule,
  Reservation,
  ReservationDetail,
  MyReservation,
  ReservationRequest,
  ScheduleFormData,
  ScheduleStatus,
  ReservationStatus,
} from '@/types';
