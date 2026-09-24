/** 업종 무관 정원 스냅샷. 특정 Schedule/업종 구현에 종속하지 않는다. */
export type CapacitySnapshot = {
  capacity: number;
  booked: number;
  available: number;
  isFull: boolean;
};

/** 정원 점유를 세는 예약 상태. Schedule request/confirm RPC와 동일. */
export const SCHEDULE_HOLDING_STATUSES = ['requested', 'confirmed'] as const;

/** 확정만 세는 조회용 상태. list_bookable_schedules available_slots와 동일. */
export const SCHEDULE_CONFIRMED_STATUSES = ['confirmed'] as const;

export type ScheduleHoldingStatus = (typeof SCHEDULE_HOLDING_STATUSES)[number];
