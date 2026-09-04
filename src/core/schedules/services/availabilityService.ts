import { getCoreClient } from '@/lib/supabase';
import type {
  AvailabilityOverride,
  AvailabilityOverrideInput,
  AvailabilityRule,
  AvailabilityRuleInput,
} from '../types/availability';

function normalizeTime(value: string): string {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return `${trimmed}:00`;
  return trimmed;
}

function mapRule(row: Record<string, unknown>): AvailabilityRule {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    staff_id: (row.staff_id as string | null) ?? null,
    day_of_week: Number(row.day_of_week) as AvailabilityRule['day_of_week'],
    start_time: String(row.start_time).slice(0, 8),
    end_time: String(row.end_time).slice(0, 8),
    slot_minutes: Number(row.slot_minutes) as AvailabilityRule['slot_minutes'],
    title: String(row.title ?? '상담'),
    max_capacity: Number(row.max_capacity ?? 1),
    is_active: Boolean(row.is_active),
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapOverride(row: Record<string, unknown>): AvailabilityOverride {
  return {
    id: String(row.id),
    organization_id: String(row.organization_id),
    staff_id: (row.staff_id as string | null) ?? null,
    override_date: String(row.override_date).slice(0, 10),
    is_closed: Boolean(row.is_closed),
    start_time: row.start_time ? String(row.start_time).slice(0, 8) : null,
    end_time: row.end_time ? String(row.end_time).slice(0, 8) : null,
    slot_minutes: row.slot_minutes
      ? (Number(row.slot_minutes) as AvailabilityOverride['slot_minutes'])
      : null,
    title: (row.title as string | null) ?? null,
    max_capacity: row.max_capacity != null ? Number(row.max_capacity) : null,
    is_active: Boolean(row.is_active),
    reason: (row.reason as string | null) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

/** Availability CRUD (숨김= is_active false, 하드 삭제 최소화) */
export const availabilityService = {
  async listRules(organizationId: string, activeOnly = true): Promise<AvailabilityRule[]> {
    let query = getCoreClient()
      .from('availability_rules' as any)
      .select('*')
      .eq('organization_id', organizationId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (activeOnly) query = query.eq('is_active', true);

    const { data, error } = await query;
    if (error) throw error;
    return ((data as unknown as Record<string, unknown>[]) ?? []).map(mapRule);
  },

  async createRule(
    organizationId: string,
    input: AvailabilityRuleInput
  ): Promise<AvailabilityRule> {
    const { data, error } = await getCoreClient()
      .from('availability_rules' as any)
      .insert({
        organization_id: organizationId,
        day_of_week: input.day_of_week,
        start_time: normalizeTime(input.start_time),
        end_time: normalizeTime(input.end_time),
        slot_minutes: input.slot_minutes ?? 30,
        title: input.title?.trim() || '상담',
        max_capacity: input.max_capacity ?? 1,
        is_active: true,
      } as any)
      .select('*')
      .single();

    if (error) throw error;
    return mapRule(data as unknown as Record<string, unknown>);
  },

  async deactivateRule(ruleId: string): Promise<void> {
    const { error } = await getCoreClient()
      .from('availability_rules' as any)
      .update({ is_active: false } as any)
      .eq('id', ruleId);
    if (error) throw error;
  },

  async listOverrides(
    organizationId: string,
    fromDate?: string,
    activeOnly = true
  ): Promise<AvailabilityOverride[]> {
    let query = getCoreClient()
      .from('availability_overrides' as any)
      .select('*')
      .eq('organization_id', organizationId)
      .order('override_date', { ascending: true });

    if (activeOnly) query = query.eq('is_active', true);
    if (fromDate) query = query.gte('override_date', fromDate);

    const { data, error } = await query;
    if (error) throw error;
    return ((data as unknown as Record<string, unknown>[]) ?? []).map(mapOverride);
  },

  async upsertOverride(
    organizationId: string,
    input: AvailabilityOverrideInput
  ): Promise<AvailabilityOverride> {
    const existing = await this.listOverrides(organizationId, input.override_date, true);
    const sameDay = existing.find((o) => o.override_date === input.override_date);

    const payload = {
      organization_id: organizationId,
      override_date: input.override_date,
      is_closed: input.is_closed,
      start_time: input.is_closed
        ? null
        : normalizeTime(input.start_time || '00:00'),
      end_time: input.is_closed ? null : normalizeTime(input.end_time || '00:00'),
      slot_minutes: input.is_closed ? null : (input.slot_minutes ?? 30),
      title: input.title?.trim() || null,
      max_capacity: input.is_closed ? null : (input.max_capacity ?? 1),
      reason: input.reason?.trim() || null,
      is_active: true,
    };

    if (sameDay) {
      const { data, error } = await getCoreClient()
        .from('availability_overrides' as any)
        .update(payload as any)
        .eq('id', sameDay.id)
        .select('*')
        .single();
      if (error) throw error;
      return mapOverride(data as unknown as Record<string, unknown>);
    }

    const { data, error } = await getCoreClient()
      .from('availability_overrides' as any)
      .insert(payload as any)
      .select('*')
      .single();
    if (error) throw error;
    return mapOverride(data as unknown as Record<string, unknown>);
  },

  async deactivateOverride(overrideId: string): Promise<void> {
    const { error } = await getCoreClient()
      .from('availability_overrides' as any)
      .update({ is_active: false } as any)
      .eq('id', overrideId);
    if (error) throw error;
  },
};
