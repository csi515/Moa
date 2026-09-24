/**
 * Core Schedule / Reservation / Availability infrastructure
 *
 * 책임 경계:
 * - Schedule: core.schedules — 예약 가능 시간 또는 운영 슬롯
 * - Reservation: core.reservations — bookable 슬롯에 대한 고객 신청
 * - Booking: 고객 배정 schedules 행(필라테스/피부). 새 테이블 없음
 * - Session/Attendance: customer_sessions / attendance_sessions. 이 barrel이 원장이 아님
 * - Piano Module: 반복 수업 시간표·학원 캘린더 UX, 상담 Availability 라벨/진입점
 * - "피아노 상담" 비즈니스 문구·화면은 Core에 두지 않는다
 */
export {
  APPOINTMENT_BOOKING_LEDGER,
  ATTENDANCE_CHECK_IN_LEDGER,
  bookingActLedger,
  CLASS_ATTENDANCE_LEDGER,
  CORE_DOMAIN_LEDGERS,
  isAppointmentBookingRow,
  isAttendanceCheckedIn,
  isBookableScheduleSlot,
  RESERVATION_LEDGER,
  RESOURCE_RESERVATION_LEDGER,
  SCHEDULE_LEDGER,
  SESSION_LEDGER,
  SLOT_RESERVATION_HOLDING_STATUSES,
} from './domainRoles';
export { coreScheduleService } from './services/coreScheduleService';
export {
  applyReservationCommand,
  canApplyReservationCommand,
  RESERVATION_COMMANDS,
  RESERVATION_MACHINE,
  RESERVATION_STATES,
} from './reservationMachine';
export { reservationService, reservationService as scheduleReservationService } from './services/reservationService';
export { availabilityService } from './services/availabilityService';
export { materializeAvailabilitySlots } from './services/materializeAvailabilitySlots';
export { availabilityCapability } from '@/core/availability';
export { capacityCapability } from '@/core/capacity';
export { sessionPassService } from './sessionPassService';
export { updateBookingStatusAtomic } from './bookingPassAtomic';
export {
  filterBookingsByDate,
  filterBookingsForSlotWindow,
  selectUpcomingBookings,
} from './bookingQuery';
export {
  buildSlotOccupancyIndex,
  buildSlotKey,
  getSlotCapacityInfo,
} from './bookingCapacity';
export { AvailabilitySettingsView } from './components/AvailabilitySettingsView';
export { ReservationInboxView } from './components/ReservationInboxView';
export { ConsultationQrModal } from './components/ConsultationQrModal';
export { CreateConsultationScheduleModal } from './components/CreateConsultationScheduleModal';
export * from './types';
export * from './types/availability';
