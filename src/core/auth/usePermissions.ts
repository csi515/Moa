import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import { applyStaffGrantTabs, normalizeStaffGrants } from '@/core/staff/staffGrants';
import { useStorageRefresh } from '@/hooks/useStorageRefresh';
import { evaluatePermission, type AuthScopeType, type Permission } from '@/core/authorization';
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

  const role = currentUser.role;
  const staffId = currentUser.staffId ?? org?.currentStaffId ?? null;
  const parentCustomerId = currentUser.parentCustomerId ?? org?.currentParentCustomerId ?? null;
  const organizationId = org?.currentOrganization?.id ?? '';
  const locationId = org?.currentLocation?.id ?? null;
  const industry = (org?.currentOrganization?.industry_type ?? 'piano') as IndustryType;
  const settings = StorageService.getSettings();

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

  return {
    role,
    staffId,
    parentCustomerId,
    industry,
    settings,
    attendanceEnabled,
    isAdmin: isOrgAdmin(role),
    isOwner: isOrgOwner(role),
    isStaff: isStaffRole(role),
    isParent: isParentRole(role),
    canPermission: (permission: Permission | string, scopeType: AuthScopeType = 'organization') =>
      evaluatePermission({
        role,
        permission,
        scope: { type: scopeType, organizationId, locationId },
      }),
    allowedTabs,
    canAccess: (tab: NavTab) => allowedTabs.includes(tab),
    defaultTab: getDefaultTab(role, industry),
    roleLabel: getUserRoleLabel(role, industry),
    roleBadge: getUserRoleBadge(role, industry),
  };
}
