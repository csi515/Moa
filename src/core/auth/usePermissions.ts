import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import {
  canAccessTab,
  getAllowedTabs,
  getDefaultTab,
  getUserRoleBadge,
  getUserRoleLabel,
  isOrgAdmin,
  isOrgOwner,
  isStaffRole,
} from './permissions';

export function usePermissions() {
  const { currentUser } = useApp();
  const org = useOptionalOrganization();

  const role = currentUser.role;
  const staffId = currentUser.staffId ?? org?.currentStaffId ?? null;
  const industry = (org?.currentOrganization?.industry_type ?? 'piano') as IndustryType;

  const allowedTabs = useMemo(() => getAllowedTabs(role, industry), [role, industry]);

  return {
    role,
    staffId,
    industry,
    isAdmin: isOrgAdmin(role),
    isOwner: isOrgOwner(role),
    isStaff: isStaffRole(role),
    allowedTabs,
    canAccess: (tab: NavTab) => canAccessTab(role, industry, tab),
    defaultTab: getDefaultTab(role, industry),
    roleLabel: getUserRoleLabel(role),
    roleBadge: getUserRoleBadge(role),
  };
}
