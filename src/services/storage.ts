import { getStorageAdapter } from './adapters';
import { setIndustryType } from './adapters/storageContext';
import { createDaycareCareStorage } from '@/modules/daycare/care/careStorage';
import { createAttendanceStorage } from './storage/attendanceStorage';
import { createCustomerStorage } from './storage/customerStorage';
import { createDashboardStatsStorage } from './storage/dashboardStatsStorage';
import { createEventsStorage } from './storage/eventsStorage';
import { createFinanceStorage } from './storage/financeStorage';
import { createNotificationsStorage } from './storage/notificationsStorage';
import { createParentEducationStorage } from './storage/parentEducationStorage';
import { createRecordsStorage } from './storage/recordsStorage';
import { createScheduleStorage } from './storage/scheduleStorage';
import { createSessionPassStorage } from './storage/sessionPassStorage';
import { createSettingsStorage } from './storage/settingsStorage';
import { createShuttleRideStorage } from './storage/shuttleRideStorage';
import { createStaffClassStorage } from './storage/staffClassStorage';
import { createTextbookStorage } from './storage/textbookStorage';
import type { StorageApi } from './storage/helpers';

type Listener = () => void;

const storageCore = {
  async hydrate(organizationId: string, industryType?: string | null): Promise<void> {
    setIndustryType(industryType ?? null);
    await getStorageAdapter().hydrate(organizationId, industryType);
  },

  clearOrganization(): void {
    getStorageAdapter().clearOrganization();
  },

  isHydrated(): boolean {
    return getStorageAdapter().isHydrated();
  },

  isHydrating(): boolean {
    return getStorageAdapter().isHydrating();
  },

  subscribe(listener: Listener): () => void {
    return getStorageAdapter().subscribe(listener);
  },
};

const storageApi = storageCore as StorageApi;

export const StorageService = Object.assign(
  storageCore,
  createCustomerStorage(storageApi),
  createStaffClassStorage(),
  createRecordsStorage(storageApi),
  createEventsStorage(storageApi),
  createNotificationsStorage(),
  createDashboardStatsStorage(storageApi),
  createScheduleStorage(),
  createSessionPassStorage(),
  createShuttleRideStorage(),
  createSettingsStorage(storageApi),
  createParentEducationStorage(storageApi),
  createAttendanceStorage(storageApi),
  createFinanceStorage(storageApi),
  createTextbookStorage(storageApi),
  createDaycareCareStorage(storageApi)
);
