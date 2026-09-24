import { useCallback, useEffect, useState } from 'react';
import { resolveLocationSelection } from './locationHelpers';
import {
  clearStoredLocationId,
  getStoredLocationId,
  locationService,
  storeLocationId,
} from './locationService';
import type { Location } from './types';

/**
 * OrganizationProvider 확장점. 선택이 없어도 기존 org context 는 그대로 동작한다.
 */
export function useOrganizationLocationState(organizationId: string | null): {
  locations: Location[];
  currentLocation: Location | null;
  selectLocation: (locationId: string | null) => void;
} {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(() =>
    getStoredLocationId()
  );

  useEffect(() => {
    if (!organizationId) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    void locationService.list(organizationId).then(
      (rows) => {
        if (!cancelled) setLocations(rows);
      },
      () => {
        if (!cancelled) setLocations([]);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const currentLocation = resolveLocationSelection(
    locations,
    organizationId,
    selectedLocationId
  );

  const selectLocation = useCallback(
    (locationId: string | null) => {
      if (!locationId) {
        clearStoredLocationId();
        setSelectedLocationId(null);
        return;
      }
      if (!organizationId) return;
      const found = locations.find(
        (row) => row.id === locationId && row.organizationId === organizationId
      );
      if (!found) return;
      storeLocationId(locationId);
      setSelectedLocationId(locationId);
    },
    [locations, organizationId]
  );

  return { locations, currentLocation, selectLocation };
}
