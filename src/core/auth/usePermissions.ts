import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import { applyStaffGrantTabs, normalizeStaffGrants } from '@/core/staff/staffGrants';
import { useStorageRefresh } from '@/hooks/useStorageRefresh';
import { createRequestContext } from '@/core/application/requestContext';
import type { RequestContext } from '@/core/application/types';
import { evaluatePermission, type AuthorizationGrant, type AuthScopeType, type Permission } from '@/core/authorization';
import { resolveAuthScope } from '@/core/authorization/scopes';
import { canAccessLocation as locationIsAccessible } from '@/core/locations/locationAware';
import { locationService } from '@/core/locations/locationService';
import {
  getAllowedTabs,
  getDefaultTab,
  getUserRoleBadge,
  getUserRoleLabel,
  isOrgAdmin,
  isOrgOwner,
  isStaffRole,
  isParentRole,
} from './permissions';

export function usePermissions() {
  const { currentUser } = useApp();
  const org = useOptionalOrganization();
  // 설정·강사 grants 변경만 — students/bookings 변경으로 탭 재계산 금지
  const refreshKey = useStorageRefresh('settings');

  const role = org?.currentRole ?? currentUser.role;
  const staffId = currentUser.staffId ?? org?.currentStaffId ?? null;
  const parentCustomerId = currentUser.parentCustomerId ?? org?.currentParentCustomerId ?? null;
  const organizationId = org?.currentOrganization?.id ?? '';
  const locationId = org?.currentLocation?.id ?? null;
  const industry = (org?.currentOrganization?.industry_type ?? 'piano') as IndustryType;
  const settings = StorageService.getSettings();
  const [extraGrants, setExtraGrants] = useState<AuthorizationGrant[]>([]);

  useEffect(() => {
    if (!organizationId) {
      setExtraGrants([]);
      return;
    }
    let cancelled = false;
    void locationService.listAccessGrants(organizationId).then((grants) => {
      if (!cancelled) setExtraGrants(grants);
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const staffGrants = useMemo(() => {
    if (!isStaffRole(role) || !staffId) return null;
    const teacher = StorageService.getTeachers().find((item) => item.id === staffId);
    return normalizeStaffGrants(teacher?.grants);
  }, [role, staffId, refreshKey]);

  const allowedTabs = useMemo(
    () =>
      applyStaffGrantTabs(
        getAllowedTabs(role, industry, settings),
        staffGrants,
        isStaffRole(role)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [role, industry, settings.features?.attendance?.enabled, refreshKey, staffGrants]
  );

  const attendanceEnabled = useMemo(
    () => isAttendanceModuleEnabled(settings, industry),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.features?.attendance?.enabled, industry, refreshKey]
  );

  const requestContext = useMemo<RequestContext | null>(() => {
    if (!currentUser.id || !organizationId) return null;
    return createRequestContext({
      userId: currentUser.id,
      organizationId,
      role,
      locationId,
      staffId,
      extraGrants,
      locations: org?.locations ?? [],
      customerId: parentCustomerId,
    });
  }, [
    currentUser.id,
    extraGrants,
    locationId,
    org?.locations,
    organizationId,
    parentCustomerId,
    role,
    staffId,
  ]);

  return {
    role,
    requestContext,
    staffId,
    parentCustomerId,
    industry,
    settings,
    attendanceEnabled,
    isAdmin: isOrgAdmin(role),
    isOwner: isOrgOwner(role),
    isStaff: isStaffRole(role),
    isParent: isParentRole(role),
    canAccessLocation: (targetLocationId: string) =>
      locationIsAccessible({ organizationId, role, extraGrants }, targetLocationId),
    canPermission: (
      permission: Permission | string,
      scopeType: AuthScopeType = 'organization',
      scopeId?: string | null
    ) => {
      const targetLocationId = scopeType === 'location' ? (scopeId ?? locationId) : locationId;
      if (
        scopeType === 'location' &&
        !locationIsAccessible({ organizationId, role, extraGrants }, targetLocationId)
      ) {
        return false;
      }
      return evaluatePermission({
        role,
        permission,
        scope: resolveAuthScope({
          organizationId,
          type: scopeType,
          locationId: targetLocationId,
          customerId: parentCustomerId,
          scopeId,
        }),
        extraGrants,
      });
    },
    allowedTabs,
    canAccess: (tab: NavTab) => allowedTabs.includes(tab),
    defaultTab: getDefaultTab(role, industry),
    roleLabel: getUserRoleLabel(role, industry),
    roleBadge: getUserRoleBadge(role, industry),
  };
}
