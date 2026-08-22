import React, { useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { Organization, MemberRole } from '../../lib/supabase';
import { StorageService } from '../../services/storage';
import { connectStaffOnLogin } from '../staff/services/staffAccountService';
import { connectParentOnLogin } from '../parent/services/parentAccountService';
import { fetchParentPortalTree } from '../parent/services/parentPortalService';
import {
  isParentPortalModeActive,
  setParentPortalModeActive,
} from '../parent/services/appModeService';
import * as orgService from './services/organizationService';

const STAFF_ROLES = new Set(['owner', 'admin', 'manager', 'staff']);

interface OrganizationContextType {
  organizations: orgService.OrganizationMembership[];
  currentOrganization: Organization | null;
  currentRole: MemberRole | null;
  currentStaffId: string | null;
  currentParentCustomerId: string | null;
  globalParentId: string | null;
  isParentOnly: boolean;
  canAccessParentPortal: boolean;
  parentPortalActive: boolean;
  portalChildCount: number;
  loading: boolean;
  selectOrganization: (organizationId: string) => void;
  clearOrganization: () => void;
  createOrganization: (name: string, industryType?: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  enterParentPortal: () => void;
  exitParentPortal: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<orgService.OrganizationMembership[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<MemberRole | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [currentParentCustomerId, setCurrentParentCustomerId] = useState<string | null>(null);
  const [globalParentId, setGlobalParentId] = useState<string | null>(null);
  const [isParentOnly, setIsParentOnly] = useState(false);
  const [canAccessParentPortal, setCanAccessParentPortal] = useState(false);
  const [portalChildCount, setPortalChildCount] = useState(0);
  const [parentPortalActive, setParentPortalActiveState] = useState(isParentPortalModeActive);
  const [loading, setLoading] = useState(true);

  const applySelection = useCallback(
    (memberships: orgService.OrganizationMembership[], organizationId: string | null) => {
      if (!organizationId || memberships.length === 0) {
        setCurrentOrganization(null);
        setCurrentRole(null);
        setCurrentStaffId(null);
        setCurrentParentCustomerId(null);
        return;
      }

      const membership = memberships.find((m) => m.organizationId === organizationId);
      if (membership) {
        setCurrentOrganization(membership.organization);
        setCurrentRole(membership.role);
        setCurrentStaffId(membership.staffId);
        setCurrentParentCustomerId(membership.parentCustomerId);
        orgService.storeOrganizationId(organizationId);
        return;
      }

      orgService.clearStoredOrganizationId();
      setCurrentOrganization(null);
      setCurrentRole(null);
      setCurrentStaffId(null);
      setCurrentParentCustomerId(null);
    },
    []
  );

  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setCurrentRole(null);
      setCurrentStaffId(null);
      setCurrentParentCustomerId(null);
      setGlobalParentId(null);
      setIsParentOnly(false);
      setCanAccessParentPortal(false);
      setPortalChildCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await connectStaffOnLogin();
      await connectParentOnLogin();

      let portalChildren = 0;
      let parentId: string | null = null;
      try {
        const tree = await fetchParentPortalTree();
        portalChildren = tree.children.length;
        parentId = tree.parent?.id ?? null;
      } catch {
        /* offline */
      }

      setGlobalParentId(parentId);
      setPortalChildCount(portalChildren);

      const memberships = await orgService.fetchUserOrganizations(user.id);
      setOrganizations(memberships);

      const staffMemberships = memberships.filter((m) => STAFF_ROLES.has(m.role));
      const hasLegacyParentMembership = memberships.some((m) => m.role === 'parent');
      const hasParentAccess = portalChildren > 0 || hasLegacyParentMembership;

      setCanAccessParentPortal(hasParentAccess && parentId !== null);

      const parentOnly = staffMemberships.length === 0 && hasParentAccess;
      setIsParentOnly(parentOnly);

      if (parentOnly) {
        setParentPortalActiveState(true);
        setParentPortalModeActive(true);
        orgService.clearStoredOrganizationId();
        applySelection(memberships, null);
        return;
      }

      const storedId = orgService.getStoredOrganizationId();
      const autoId =
        storedId && memberships.some((m) => m.organizationId === storedId)
          ? storedId
          : staffMemberships.length === 1
            ? staffMemberships[0].organizationId
            : memberships.length === 1
              ? memberships[0].organizationId
              : null;

      applySelection(memberships, autoId);
    } finally {
      setLoading(false);
    }
  }, [user, applySelection]);

  useEffect(() => {
    refreshOrganizations();
  }, [refreshOrganizations]);

  const selectOrganization = useCallback(
    (organizationId: string) => {
      applySelection(organizations, organizationId);
    },
    [organizations, applySelection]
  );

  const clearOrganization = useCallback(() => {
    orgService.clearStoredOrganizationId();
    setCurrentOrganization(null);
    setCurrentRole(null);
    setCurrentStaffId(null);
    setCurrentParentCustomerId(null);
    StorageService.clearOrganization();
  }, []);

  const createOrganization = useCallback(
    async (name: string, industryType = 'piano') => {
      const orgId = await orgService.createOrganization(name, industryType);
      await refreshOrganizations();
      selectOrganization(orgId);
    },
    [refreshOrganizations, selectOrganization]
  );

  const enterParentPortal = useCallback(() => {
    setParentPortalActiveState(true);
    setParentPortalModeActive(true);
  }, []);

  const exitParentPortal = useCallback(() => {
    setParentPortalActiveState(false);
    setParentPortalModeActive(false);
  }, []);

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        currentRole,
        currentStaffId,
        currentParentCustomerId,
        globalParentId,
        isParentOnly,
        canAccessParentPortal,
        parentPortalActive,
        portalChildCount,
        loading,
        selectOrganization,
        clearOrganization,
        createOrganization,
        refreshOrganizations,
        enterParentPortal,
        exitParentPortal,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export function useOrganization(): OrganizationContextType {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}

export function useOptionalOrganization(): OrganizationContextType | null {
  return useContext(OrganizationContext) ?? null;
}
