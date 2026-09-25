import { getStorageAdapter } from './adapters';
import { setIndustryType } from './adapters/storageContext';
import { createDaycareCareStorage } from '@/modules/daycare/care/careStorage';
import { createAttendanceStorage } from './storage/attendanceStorage';
import { createCustomerStorage } from './storage/customerStorage';
import { createDashboardStatsStorage } from './storage/dashboardStatsStorage';
import { createEventsStorage } from './storage/eventsStorage';
import { createFinanceStorage } from './storage/financeStorage';
import { createFinanceInvoicePersist } from './storage/financeInvoicePersist';
import { createInvoicePaymentService } from '@/core/finance/services/invoicePaymentService';
import { createNotificationsStorage } from './storage/notificationsStorage';
import { createParentEducationStorage } from './storage/parentEducationStorage';
import { createPracticeRoomBookingStorage } from './storage/practiceRoomBookingStorage';
import { createRecordsStorage } from './storage/recordsStorage';
import { createScheduleStorage } from './storage/scheduleStorage';
import { createSessionPassStorage } from './storage/sessionPassStorage';
import { createSettingsStorage } from './storage/settingsStorage';
import { createShuttleRideStorage } from './storage/shuttleRideStorage';
import { createStaffClassStorage } from './storage/staffClassStorage';
import { createTextbookStorage } from './storage/textbookStorage';
import type { StorageApi } from './storage/helpers';
import type { StorageListener } from './adapters/types';

const storageCore = {
  async hydrate(organizationId: string, industryType?: string | null): Promise<void> {
    setIndustryType(industryType ?? null);
    await getStorageAdapter().hydrate(organizationId, industryType);
  },

  clearOrganization(): void {
    getStorageAdapter().clearOrganization();
  },

  clearBusinessCachesOnSignOut(): void {
    getStorageAdapter().clearBusinessCachesOnSignOut?.();
  },

  isHydrated(): boolean {
    return getStorageAdapter().isHydrated();
  },

  isOfflineHydrated(): boolean {
    return getStorageAdapter().isOfflineHydrated?.() ?? false;
  },

  isHydrating(): boolean {
    return getStorageAdapter().isHydrating();
  },

  async flushSyncOutbox(): Promise<void> {
    await getStorageAdapter().flushSyncOutbox?.();
  },

  hasUnsyncedBusinessChanges(): boolean {
    return getStorageAdapter().hasUncommittedWrites?.() ?? false;
  },

  async prepareSignOut(options?: { discardUnsynced?: boolean }): Promise<'ready' | 'blocked'> {
    const adapter = getStorageAdapter();
    if (adapter.prepareSignOut) return adapter.prepareSignOut(options);
    if (options?.discardUnsynced) return 'ready';
    if (!adapter.hasUncommittedWrites?.()) return 'ready';
    await adapter.flushSyncOutbox?.();
    return adapter.hasUncommittedWrites?.() ? 'blocked' : 'ready';
  },

  subscribe(listener: StorageListener): () => void {
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
  createFinanceInvoicePersist(storageApi),
  createInvoicePaymentService(storageApi),
  createTextbookStorage(storageApi),
  createPracticeRoomBookingStorage(storageApi),
  createDaycareCareStorage(storageApi)
);
