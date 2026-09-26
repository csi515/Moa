import { createEventsStorage } from '@/services/storage/eventsStorage';
import { createNotificationsStorage } from '@/services/storage/notificationsStorage';
import { createParentEducationStorage } from '@/services/storage/parentEducationStorage';
import type { StorageApi } from '@/services/storage/helpers';

/** Parent persistence facade. 기존 parent/events/notifications factory를 연결한다. */
export function createParentCapabilityStorage(api: StorageApi) {
  return {
    ...createParentEducationStorage(api),
    ...createEventsStorage(api),
    ...createNotificationsStorage(),
  };
}

export type ParentCapabilityStorage = ReturnType<typeof createParentCapabilityStorage>;
