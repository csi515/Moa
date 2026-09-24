/**
 * 업종 sync capability 레지스트리.
 * Adapter는 업종 이름을 직접 분기하지 않고, 플러그인이 선언한 capability만 실행한다.
 */
import { getIndustryPlugin } from '@/core/industry/registry';
import type { StorageKey } from './storageKeys';
import { DAYCARE_SYNC_KEYS, PIANO_SYNC_KEYS } from './storageKeys';
import { hydrateDaycareEntities, persistDaycareEntity } from './sync/daycareEntitySync';
import { hydrateEducationEntities, persistEducationEntity } from './sync/educationEntitySync';
import { hydratePianoEntities, persistPianoEntity } from './sync/pianoEntitySync';
import type { PersistAbortGuard, SyncCache } from './sync/syncTypes';

export type IndustrySyncCapabilityId = string;

export type IndustrySyncCapability = {
  id: IndustrySyncCapabilityId;
  hydrate: (organizationId: string, cache: SyncCache) => Promise<void>;
  persist: (
    key: StorageKey,
    organizationId: string,
    cache: SyncCache,
    isAborted: PersistAbortGuard
  ) => Promise<boolean>;
  persistKeys: ReadonlySet<StorageKey>;
};

const CAPABILITIES = new Map<IndustrySyncCapabilityId, IndustrySyncCapability>();

export function registerIndustrySyncCapability(capability: IndustrySyncCapability): void {
  CAPABILITIES.set(capability.id, capability);
}

export function unregisterIndustrySyncCapability(id: IndustrySyncCapabilityId): void {
  CAPABILITIES.delete(id);
}

export function getIndustrySyncCapability(
  id: IndustrySyncCapabilityId
): IndustrySyncCapability | undefined {
  return CAPABILITIES.get(id);
}

export function listIndustrySyncCapabilities(): IndustrySyncCapability[] {
  return [...CAPABILITIES.values()];
}

/** 플러그인 매니페스트에 선언된 hydrate capability만 */
export function resolveIndustryHydrateCapabilities(
  industryType?: string | null
): IndustrySyncCapability[] {
  const declared = getIndustryPlugin(industryType).syncCapabilities ?? [];
  return declared
    .map((id) => CAPABILITIES.get(id))
    .filter((cap): cap is IndustrySyncCapability => Boolean(cap));
}

/** persist는 키 기준 — 등록된 capability 중 persistKeys에 포함된 것만 */
export async function persistRegisteredCapabilities(
  key: StorageKey,
  organizationId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<boolean> {
  let ok = true;
  for (const capability of CAPABILITIES.values()) {
    if (!capability.persistKeys.has(key)) continue;
    ok = (await capability.persist(key, organizationId, cache, isAborted)) && ok;
    if (isAborted()) return false;
  }
  return ok;
}

registerIndustrySyncCapability({
  id: 'piano',
  hydrate: hydratePianoEntities,
  persist: persistPianoEntity,
  persistKeys: PIANO_SYNC_KEYS,
});

registerIndustrySyncCapability({
  id: 'education',
  hydrate: hydrateEducationEntities,
  persist: persistEducationEntity,
  persistKeys: PIANO_SYNC_KEYS,
});

registerIndustrySyncCapability({
  id: 'daycare',
  hydrate: hydrateDaycareEntities,
  persist: persistDaycareEntity,
  persistKeys: DAYCARE_SYNC_KEYS,
});
