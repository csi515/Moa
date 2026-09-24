/**
 * Organization 하위 Location Capability.
 * 기존 organization_id 테넌트 경계를 대체하지 않는다.
 */
import {
  isLocationInOrganization,
  locationHoursRef,
  normalizeLocationCode,
  organizationLocationScope,
  optionalLocationId,
  resolveLocationSelection,
} from './locationHelpers';
import { locationService } from './locationService';
import { DEFAULT_LOCATION_CODE, DEFAULT_LOCATION_SLUG, DEFAULT_LOCATION_TIMEZONE } from './types';

export const locationCapability = {
  defaultCode: DEFAULT_LOCATION_CODE,
  defaultSlug: DEFAULT_LOCATION_SLUG,
  defaultTimezone: DEFAULT_LOCATION_TIMEZONE,
  list: locationService.list,
  getById: locationService.getById,
  upsert: locationService.upsert,
  setActive: locationService.setActive,
  ensureDefault: locationService.ensureDefault,
  scope: organizationLocationScope,
  optionalLocationId,
  isInOrganization: isLocationInOrganization,
  resolveSelection: resolveLocationSelection,
  hoursRef: locationHoursRef,
  normalizeCode: normalizeLocationCode,
} as const;

export type LocationCapability = typeof locationCapability;
