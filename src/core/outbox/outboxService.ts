import { getCoreClient } from '@/lib/supabase';
import { withOutboxContext } from './payload';
import { claimOutboxEvents, completeOutboxEvent, failOutboxEvent, listOutboxEvents } from './outboxRepository';
import type { EnqueueOutboxInput } from './types';

export async function enqueueOutboxEvent(input: EnqueueOutboxInput): Promise<string> {
  const client = getCoreClient();
  const { data, error } = await client.rpc('enqueue_outbox_event', {
    p_organization_id: input.organizationId,
    p_aggregate_type: input.aggregateType,
    p_aggregate_id: input.aggregateId,
    p_event_type: input.eventType,
    p_payload: withOutboxContext(input),
    p_location_id: input.locationId ?? null,
  } as never);
  if (error) throw new Error(error.message || 'Outbox enqueue에 실패했습니다.');
  if (!data) throw new Error('Outbox enqueue에 실패했습니다.');
  return String(data);
}

export const outboxService = {
  enqueue: enqueueOutboxEvent,
  list: listOutboxEvents,
  claim: claimOutboxEvents,
  complete: completeOutboxEvent,
  fail: failOutboxEvent,
};
