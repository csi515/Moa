/**
 * 지점 CRUD. 쓰기는 RPC. 기존 organization_id 테넌트 경계를 유지한다.
 */
import { getCoreClient } from '@/lib/supabase';
import { mapLocationRpcError } from './locationErrors';
import { rowToLocation, type LocationRow } from './locationMappers';
import { getLocationById, listLocations } from './locationRepository';
import type { Location, LocationListQuery, UpsertLocationInput } from './types';

const LOCATION_ID_STORAGE_KEY = 'moa_current_location_id';

export function getStoredLocationId(): string | null {
  return localStorage.getItem(LOCATION_ID_STORAGE_KEY);
}

export function storeLocationId(locationId: string): void {
  localStorage.setItem(LOCATION_ID_STORAGE_KEY, locationId);
}

export function clearStoredLocationId(): void {
  localStorage.removeItem(LOCATION_ID_STORAGE_KEY);
}

async function callLocationRpc(name: 'upsert_location' | 'set_location_active', args: Record<string, unknown>) {
  const client = getCoreClient();
  const { data, error } = await client.rpc(name, args as never);
  if (error) throw new Error(mapLocationRpcError(error).message);
  if (!data) throw new Error('지점 처리에 실패했습니다.');
  return data;
}

export const locationService = {
  list(organizationId: string, query: LocationListQuery = {}) {
    return listLocations(organizationId, query);
  },

  getById(organizationId: string, locationId: string) {
    return getLocationById(organizationId, locationId);
  },

  async upsert(organizationId: string, input: UpsertLocationInput): Promise<Location> {
    const data = await callLocationRpc('upsert_location', {
      p_organization_id: organizationId,
      p_name: input.name,
      p_code: input.code ?? null,
      p_slug: input.slug ?? null,
      p_address: input.address ?? null,
      p_phone: input.phone ?? null,
      p_timezone: input.timezone ?? null,
      p_id: input.id ?? null,
      p_metadata: input.metadata ?? {},
    });
    return rowToLocation(data as LocationRow);
  },

  async setActive(organizationId: string, locationId: string, active: boolean): Promise<Location> {
    const data = await callLocationRpc('set_location_active', {
      p_organization_id: organizationId,
      p_location_id: locationId,
      p_active: active,
    });
    return rowToLocation(data as LocationRow);
  },

  /** 조직 생성 후 기본 지점. 트리거와 멱등. 실패해도 조직 생성은 유지. */
  async ensureDefault(organizationId: string): Promise<string | null> {
    const client = getCoreClient();
    const { data, error } = await client.rpc('ensure_default_organization_location', {
      p_organization_id: organizationId,
    });
    if (error) return null;
    return data ? String(data) : null;
  },
};
