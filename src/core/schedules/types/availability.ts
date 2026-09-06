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

export interface AvailabilityTimeWindow {
  start_time: string;
  end_time: string;
}

export interface AvailabilityRuleInput {
  day_of_week: AvailabilityDayOfWeek;
  start_time: string;
  end_time: string;
  slot_minutes?: AvailabilitySlotMinutes;
  title?: string;
  max_capacity?: number;
  /** 예약 시작 간격(분). 미설정 시 slot_minutes와 동일 */
  interval_minutes?: AvailabilitySlotMinutes;
  metadata?: Record<string, unknown>;
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
  /** 예외일 다중 구간 (날짜당 1행 유지) */
  windows?: AvailabilityTimeWindow[];
  metadata?: Record<string, unknown>;
}

/** rule/override metadata에서 예약 간격 추출 */
export function getIntervalMinutes(
  slotMinutes: AvailabilitySlotMinutes,
  metadata?: Record<string, unknown> | null
): AvailabilitySlotMinutes {
  const raw = metadata?.interval_minutes;
  const n = typeof raw === 'number' ? raw : Number(raw);
  if (n === 15 || n === 20 || n === 30 || n === 45 || n === 60) return n;
  return slotMinutes;
}

/** override metadata.windows 또는 legacy start/end */
export function getOverrideWindows(
  override: Pick<AvailabilityOverride, 'start_time' | 'end_time' | 'metadata' | 'is_closed'>
): AvailabilityTimeWindow[] {
  if (override.is_closed) return [];
  const metaWindows = override.metadata?.windows;
  if (Array.isArray(metaWindows) && metaWindows.length > 0) {
    return metaWindows
      .map((w) => {
        const row = w as Record<string, unknown>;
        return {
          start_time: String(row.start_time ?? '').slice(0, 5),
          end_time: String(row.end_time ?? '').slice(0, 5),
        };
      })
      .filter((w) => w.start_time && w.end_time && w.start_time < w.end_time);
  }
  if (override.start_time && override.end_time) {
    return [
      {
        start_time: override.start_time.slice(0, 5),
        end_time: override.end_time.slice(0, 5),
      },
    ];
  }
  return [];
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
