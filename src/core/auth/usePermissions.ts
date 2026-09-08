import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import { applyStaffGrantTabs, normalizeStaffGrants } from '@/core/staff/staffGrants';
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
  const { currentUser, refreshKey } = useApp();
  const org = useOptionalOrganization();

  const role = currentUser.role;
  const staffId = currentUser.staffId ?? org?.currentStaffId ?? null;
  const parentCustomerId = currentUser.parentCustomerId ?? org?.currentParentCustomerId ?? null;
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
    // refreshKey: 설정 저장 후 출입(PIN) on/off 즉시 반영
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
    allowedTabs,
    canAccess: (tab: NavTab) => allowedTabs.includes(tab),
    defaultTab: getDefaultTab(role, industry),
    roleLabel: getUserRoleLabel(role),
    roleBadge: getUserRoleBadge(role),
  };
}
