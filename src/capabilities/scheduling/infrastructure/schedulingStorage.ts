import { createRecordsStorage } from '@/services/storage/recordsStorage';
import { createScheduleStorage } from '@/services/storage/scheduleStorage';
import type { StorageApi } from '@/services/storage/helpers';

/** Scheduling persistence facade. 기존 schedule/records factory를 연결한다. */
export function createSchedulingCapabilityStorage(api: StorageApi) {
  return {
    ...createScheduleStorage(),
    ...createRecordsStorage(api),
  };
}

export type SchedulingCapabilityStorage = ReturnType<typeof createSchedulingCapabilityStorage>;
