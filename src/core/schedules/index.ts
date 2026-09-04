/**
 * Core Schedule / Reservation / Availability infrastructure
 *
 * 책임 경계:
 * - Core: 시간 기반 Schedule, Availability 규칙, Reservation RPC·중복 방지
 * - Piano Module: 반복 수업 시간표·학원 캘린더 UX, 상담 Availability 라벨/진입점
 * - "피아노 상담" 비즈니스 문구·화면은 Core에 두지 않는다
 */
export { coreScheduleService } from './services/coreScheduleService';
export { reservationService } from './services/reservationService';
export { availabilityService } from './services/availabilityService';
export { materializeAvailabilitySlots } from './services/materializeAvailabilitySlots';
export { AvailabilitySettingsView } from './components/AvailabilitySettingsView';
export { ReservationInboxView } from './components/ReservationInboxView';
export * from './types';
export * from './types/availability';
