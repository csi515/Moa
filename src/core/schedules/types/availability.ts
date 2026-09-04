/** Core Availability — 업종 무관 가능시간 규칙 */

export type AvailabilitySlotMinutes = 15 | 20 | 30 | 45 | 60;

/** 0=일요일 … 6=토요일 (JS Date.getDay와 동일) */
export type AvailabilityDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AvailabilityRule {
  id: string;
  organization_id: string;
  staff_id: string | null;
  day_of_week: AvailabilityDayOfWeek;
  start_time: string; // HH:mm:ss or HH:mm
  end_time: string;
  slot_minutes: AvailabilitySlotMinutes;
  title: string;
  max_capacity: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityOverride {
  id: string;
  organization_id: string;
  staff_id: string | null;
  override_date: string; // YYYY-MM-DD
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
  slot_minutes: AvailabilitySlotMinutes | null;
  title: string | null;
  max_capacity: number | null;
  is_active: boolean;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRuleInput {
  day_of_week: AvailabilityDayOfWeek;
  start_time: string;
  end_time: string;
  slot_minutes?: AvailabilitySlotMinutes;
  title?: string;
  max_capacity?: number;
}

export interface AvailabilityOverrideInput {
  override_date: string;
  is_closed: boolean;
  start_time?: string | null;
  end_time?: string | null;
  slot_minutes?: AvailabilitySlotMinutes | null;
  title?: string | null;
  max_capacity?: number | null;
  reason?: string | null;
}

export const AVAILABILITY_SOURCE = 'availability_rule' as const;

export const DAY_OF_WEEK_LABELS: Record<AvailabilityDayOfWeek, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};
