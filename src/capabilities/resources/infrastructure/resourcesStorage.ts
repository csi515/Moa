import { createPracticeRoomBookingStorage } from '@/services/storage/practiceRoomBookingStorage';
import type { StorageApi } from '@/services/storage/helpers';

/** Resources persistence facade. 기존 practice-room factory를 연결한다. */
export function createResourcesCapabilityStorage(api: StorageApi) {
  return createPracticeRoomBookingStorage(api);
}

export type ResourcesCapabilityStorage = ReturnType<typeof createResourcesCapabilityStorage>;
