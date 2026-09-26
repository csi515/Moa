import { getStorageAdapter } from './adapters';
import { setIndustryType } from './adapters/storageContext';
import { createAttendanceCapabilityStorage } from '@/capabilities/attendance/infrastructure/attendanceStorage';
import { createBillingCapabilityStorage } from '@/capabilities/billing/infrastructure/billingStorage';
import { createBookingCapabilityStorage } from '@/capabilities/booking/infrastructure/bookingStorage';
import { createCommerceCapabilityStorage } from '@/capabilities/commerce/infrastructure/commerceStorage';
import { createParentCapabilityStorage } from '@/capabilities/parent/infrastructure/parentStorage';
import { createResourcesCapabilityStorage } from '@/capabilities/resources/infrastructure/resourcesStorage';
import { createRosterCapabilityStorage } from '@/capabilities/roster/infrastructure/rosterStorage';
import { createSchedulingCapabilityStorage } from '@/capabilities/scheduling/infrastructure/schedulingStorage';
import { createTransportCapabilityStorage } from '@/capabilities/transport/infrastructure/transportStorage';
import { createDashboardStatsStorage } from './storage/dashboardStatsStorage';
import { createSettingsStorage } from './storage/settingsStorage';
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

/**
 * Legacy mega-facade. 신규 feature는 capability infrastructure facade를 쓴다.
 * Daycare care slice는 industries/daycare/care/bindCareStorage 가 연결한다.
 */
export const StorageService = Object.assign(
  storageCore,
  createRosterCapabilityStorage(storageApi),
  createSchedulingCapabilityStorage(storageApi),
  createBookingCapabilityStorage(),
  createResourcesCapabilityStorage(storageApi),
  createTransportCapabilityStorage(),
  createSettingsStorage(storageApi),
  createParentCapabilityStorage(storageApi),
  createAttendanceCapabilityStorage(storageApi),
  createBillingCapabilityStorage(storageApi),
  createCommerceCapabilityStorage(storageApi),
  createDashboardStatsStorage(storageApi)
);
