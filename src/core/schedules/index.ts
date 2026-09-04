/**
 * Core Schedule / Reservation infrastructure
 *
 * 책임 경계:
 * - Core: 시간 기반 Schedule, Availability(가능 시간) 인프라, Reservation RPC·중복 방지
 * - Piano Module: 반복 수업 시간표·학원 캘린더 UX, 상담 Availability 라벨/진입점
 * - "피아노 상담" 비즈니스 문구·화면은 Core에 두지 않는다
 *
 * 현재 상태:
 * - schedules / reservations 서비스·컴포넌트는 제공
 * - Piano 일정 허브는 수업 시간표+학원 캘린더를 연결 (bookable reservation UI는 상담 STEP에서 연결)
 */
export { coreScheduleService } from './services/coreScheduleService';
export { reservationService } from './services/reservationService';
export * from './types';
