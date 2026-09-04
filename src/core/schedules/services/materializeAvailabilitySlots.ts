import { getCoreClient } from '@/lib/supabase';
import type { CoreSchedule } from '@/types';
import {
  AVAILABILITY_SOURCE,
  type AvailabilityOverride,
  type AvailabilityRule,
  type AvailabilitySlotMinutes,
} from '../types/availability';
import { availabilityService } from './availabilityService';
import { coreScheduleService } from './coreScheduleService';

const DEFAULT_HORIZON_DAYS = 14;

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseHm(value: string): { h: number; m: number } {
  const [h, m] = value.slice(0, 5).split(':').map(Number);
  return { h, m };
}

function combineLocal(dateKey: string, time: string): Date {
  const { h, m } = parseHm(time);
  const [y, mo, d] = dateKey.split('-').map(Number);
  return new Date(y, mo - 1, d, h, m, 0, 0);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function chunkSlots(
  dateKey: string,
  startTime: string,
  endTime: string,
  slotMinutes: AvailabilitySlotMinutes
): Array<{ starts: Date; ends: Date }> {
  const slots: Array<{ starts: Date; ends: Date }> = [];
  let cursor = combineLocal(dateKey, startTime);
  const end = combineLocal(dateKey, endTime);
  const stepMs = slotMinutes * 60 * 1000;

  while (cursor.getTime() + stepMs <= end.getTime()) {
    const next = new Date(cursor.getTime() + stepMs);
    slots.push({ starts: cursor, ends: next });
    cursor = next;
  }
  return slots;
}

function slotKey(orgId: string, startsAt: string, endsAt: string): string {
  return `${orgId}|${startsAt}|${endsAt}`;
}

export interface MaterializeResult {
  created: number;
  kept: number;
  hidden: number;
}

/**
 * Availability 규칙 → core.schedules(is_bookable) 슬롯 생성
 * - 기존 일정과 겹치면 스킵
 * - 더 이상 필요 없는 생성 슬롯은 is_bookable=false로 숨김 (예약 있으면 유지)
 */
export async function materializeAvailabilitySlots(
  organizationId: string,
  horizonDays = DEFAULT_HORIZON_DAYS
): Promise<MaterializeResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizonEnd = new Date(today);
  horizonEnd.setDate(horizonEnd.getDate() + horizonDays);

  const [rules, overrides, schedules] = await Promise.all([
    availabilityService.listRules(organizationId, true),
    availabilityService.listOverrides(organizationId, toDateKey(today), true),
    coreScheduleService.getOrganizationSchedules(
      organizationId,
      today.toISOString(),
      horizonEnd.toISOString()
    ),
  ]);

  const overrideByDate = new Map(overrides.map((o) => [o.override_date, o]));
  const desiredKeys = new Set<string>();
  const desiredSlots: Array<{
    key: string;
    title: string;
    starts: Date;
    ends: Date;
    maxCapacity: number;
    ruleId?: string;
    overrideId?: string;
  }> = [];

  for (let offset = 0; offset < horizonDays; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateKey = toDateKey(date);
    const dow = date.getDay() as AvailabilityRule['day_of_week'];
    const override = overrideByDate.get(dateKey);

    let windows: Array<{
      start: string;
      end: string;
      slotMinutes: AvailabilitySlotMinutes;
      title: string;
      maxCapacity: number;
      ruleId?: string;
      overrideId?: string;
    }> = [];

    if (override?.is_closed) {
      windows = [];
    } else if (override && !override.is_closed && override.start_time && override.end_time) {
      windows = [
        {
          start: override.start_time,
          end: override.end_time,
          slotMinutes: (override.slot_minutes ?? 30) as AvailabilitySlotMinutes,
          title: override.title || '상담',
          maxCapacity: override.max_capacity ?? 1,
          overrideId: override.id,
        },
      ];
    } else {
      windows = rules
        .filter((r) => r.day_of_week === dow)
        .map((r) => ({
          start: r.start_time,
          end: r.end_time,
          slotMinutes: r.slot_minutes,
          title: r.title,
          maxCapacity: r.max_capacity,
          ruleId: r.id,
        }));
    }

    for (const win of windows) {
      for (const slot of chunkSlots(dateKey, win.start, win.end, win.slotMinutes)) {
        const startsAt = slot.starts.toISOString();
        const endsAt = slot.ends.toISOString();
        const key = slotKey(organizationId, startsAt, endsAt);

        const blocked = schedules.some((s) => {
          const meta = s.metadata ?? {};
          const isGenerated = meta.source === AVAILABILITY_SOURCE;
          if (isGenerated) return false;
          if (s.status === 'cancelled') return false;
          return overlaps(slot.starts, slot.ends, new Date(s.starts_at), new Date(s.ends_at));
        });
        if (blocked) continue;

        desiredKeys.add(key);
        desiredSlots.push({
          key,
          title: win.title,
          starts: slot.starts,
          ends: slot.ends,
          maxCapacity: win.maxCapacity,
          ruleId: win.ruleId,
          overrideId: win.overrideId,
        });
      }
    }
  }

  const generated = schedules.filter(
    (s) => (s.metadata ?? {}).source === AVAILABILITY_SOURCE
  );

  let created = 0;
  let kept = 0;
  let hidden = 0;

  const existingByKey = new Map<string, CoreSchedule>();
  for (const s of generated) {
    const key =
      typeof (s.metadata as { slot_key?: string })?.slot_key === 'string'
        ? String((s.metadata as { slot_key?: string }).slot_key)
        : slotKey(organizationId, s.starts_at, s.ends_at);
    existingByKey.set(key, s);
  }

  for (const slot of desiredSlots) {
    const existing = existingByKey.get(slot.key);
    if (existing) {
      kept += 1;
      if (!existing.is_bookable) {
        await coreScheduleService.toggleBookable(existing.id, true);
      }
      continue;
    }

    const { error } = await getCoreClient()
      .from('schedules')
      .insert({
        organization_id: organizationId,
        title: slot.title,
        starts_at: slot.starts.toISOString(),
        ends_at: slot.ends.toISOString(),
        is_bookable: true,
        max_capacity: slot.maxCapacity,
        status: 'scheduled',
        metadata: {
          source: AVAILABILITY_SOURCE,
          slot_key: slot.key,
          rule_id: slot.ruleId ?? null,
          override_id: slot.overrideId ?? null,
        },
      } as any);

    if (error) throw error;
    created += 1;
  }

  for (const [key, schedule] of existingByKey) {
    if (desiredKeys.has(key)) continue;
    if (!schedule.is_bookable) continue;

    // 예약이 있으면 숨기지 않고 유지 (히스토리)
    const { count, error } = await getCoreClient()
      .from('reservations' as any)
      .select('id', { count: 'exact', head: true })
      .eq('schedule_id', schedule.id)
      .in('status', ['requested', 'confirmed']);

    if (error) throw error;
    if ((count ?? 0) > 0) continue;

    await coreScheduleService.toggleBookable(schedule.id, false);
    hidden += 1;
  }

  return { created, kept, hidden };
}

export type { AvailabilityRule, AvailabilityOverride };
