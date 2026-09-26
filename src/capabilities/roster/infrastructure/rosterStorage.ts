import { createCustomerStorage } from '@/services/storage/customerStorage';
import { createStaffClassStorage } from '@/services/storage/staffClassStorage';
import type { StorageApi } from '@/services/storage/helpers';

/** Roster persistence facade. 기존 customer/staff-class factory를 연결한다. */
export function createRosterCapabilityStorage(api: StorageApi) {
  return {
    ...createCustomerStorage(api),
    ...createStaffClassStorage(),
  };
}

export type RosterCapabilityStorage = ReturnType<typeof createRosterCapabilityStorage>;
