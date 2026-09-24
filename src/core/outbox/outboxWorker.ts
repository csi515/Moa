/**
 * retry 가능한 outbox worker.
 * 외부 side effect는 consumer에서만 수행한다. 업무 TX를 대체하지 않는다.
 */
import { reservationConfirmedConsumer } from './consumers';
import { dispatchOutboxEvent } from './evaluate';
import { outboxService } from './outboxService';
import type { OutboxConsumer, OutboxEvent } from './types';

const DEFAULT_CONSUMERS: readonly OutboxConsumer[] = [reservationConfirmedConsumer];

export async function processOutboxBatch(
  organizationId: string,
  options?: {
    limit?: number;
    consumers?: readonly OutboxConsumer[];
    deliveredIds?: Set<string>;
  }
): Promise<{ processed: number; retried: number }> {
  const consumers = options?.consumers ?? DEFAULT_CONSUMERS;
  const deliveredIds = options?.deliveredIds ?? new Set<string>();
  const claimed = await outboxService.claim(organizationId, options?.limit ?? 10);
  let processed = 0;
  let retried = 0;

  for (const event of claimed) {
    const result = await processClaimedEvent(event, consumers, deliveredIds);
    if (result === 'processed') processed += 1;
    else retried += 1;
  }
  return { processed, retried };
}

export async function processClaimedEvent(
  event: OutboxEvent,
  consumers: readonly OutboxConsumer[],
  deliveredIds: Set<string>
): Promise<'processed' | 'retry'> {
  const consumer = consumers.find((row) => row.eventType === event.eventType);
  if (!consumer) {
    await outboxService.fail(event.id, `No consumer for ${event.eventType}`);
    return 'retry';
  }
  try {
    const result = dispatchOutboxEvent(event, consumer, deliveredIds);
    if (result === 'processed') {
      deliveredIds.add(event.id);
      await outboxService.complete(event.id);
      return 'processed';
    }
    await outboxService.fail(event.id, 'Consumer requested retry');
    return 'retry';
  } catch (error) {
    await outboxService.fail(event.id, error instanceof Error ? error.message : 'Outbox consumer failed');
    return 'retry';
  }
}
