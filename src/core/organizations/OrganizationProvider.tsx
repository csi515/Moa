import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { IndustryType } from '../industry/types';
import { useAuth } from '../auth/AuthProvider';
import type { Organization, MemberRole } from '../../lib/supabase';
import { StorageService } from '../../services/storage';
import { runLoginAccountSync } from '../accounts/loginBootstrapService';
import { applyOAuthSignupIntentIfAny } from '../auth/services/oauthSignupService';
import { ensureGlobalParentProfile, fetchParentPortalTree } from '../parent/services/parentPortalService';
import {
  isParentPortalModeActive,
  setParentPortalModeActive,
} from '../parent/services/appModeService';
import * as orgService from './services/organizationService';

const STAFF_ROLES = new Set(['owner', 'admin', 'manager', 'staff', 'instructor']);

interface OrganizationContextType {
  organizations: orgService.OrganizationMembership[];
  memberships: orgService.OrganizationMembership[];
  selectedMembership: orgService.OrganizationMembership | null;
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
  switchMembership: (membershipId: string) => Promise<void>;
  clearOrganization: () => void;
  createOrganization: (
    name: string,
    industryType?: IndustryType | string,
    settings?: orgService.CreateOrganizationFormExtras
  ) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
  enterParentPortal: () => void;
  exitParentPortal: () => void;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<orgService.OrganizationMembership[]>([]);
  const [selectedMembership, setSelectedMembership] = useState<orgService.OrganizationMembership | null>(null);
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

  const applyMembershipSelection = useCallback(
    (memberships: orgService.OrganizationMembership[], membershipId: string | null) => {
      if (!membershipId || memberships.length === 0) {
        setSelectedMembership(null);
        setCurrentOrganization(null);
        setCurrentRole(null);
        setCurrentStaffId(null);
        setCurrentParentCustomerId(null);
        return;
      }

      const membership = memberships.find((m) => m.id === membershipId);
      if (membership) {
        setSelectedMembership(membership);
        setCurrentOrganization(membership.organization);
        setCurrentRole(membership.role);
        setCurrentStaffId(membership.staffId);
        setCurrentParentCustomerId(membership.parentCustomerId);
        orgService.storeOrganizationId(membership.organizationId);
        return;
      }

      orgService.clearStoredOrganizationId();
      setSelectedMembership(null);
      setCurrentOrganization(null);
      setCurrentRole(null);
      setCurrentStaffId(null);
      setCurrentParentCustomerId(null);
    },
    []
  );

  const applySelection = useCallback(
    (memberships: orgService.OrganizationMembership[], organizationId: string | null) => {
      if (!organizationId || memberships.length === 0) {
        setSelectedMembership(null);
        setCurrentOrganization(null);
        setCurrentRole(null);
        setCurrentStaffId(null);
        setCurrentParentCustomerId(null);
        return;
      }

      const membership = memberships.find((m) => m.organizationId === organizationId);
      if (membership) {
        setSelectedMembership(membership);
        setCurrentOrganization(membership.organization);
        setCurrentRole(membership.role);
        setCurrentStaffId(membership.staffId);
        setCurrentParentCustomerId(membership.parentCustomerId);
        orgService.storeOrganizationId(organizationId);
        return;
      }

      orgService.clearStoredOrganizationId();
      setSelectedMembership(null);
      setCurrentOrganization(null);
      setCurrentRole(null);
      setCurrentStaffId(null);
      setCurrentParentCustomerId(null);
    },
    []
  );

  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      StorageService.clearOrganization();
      setOrganizations([]);
      setSelectedMembership(null);
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
      await applyOAuthSignupIntentIfAny();
      await runLoginAccountSync();

      let portalChildren = 0;
      let parentId: string | null = null;
      try {
        const tree = await fetchParentPortalTree();
        portalChildren = tree.children.length;
        parentId = tree.parent?.id ?? null;
      } catch {
        /* offline */
      }

      if (parentId === null) {
        try {
          parentId = await ensureGlobalParentProfile();
        } catch {
          /* offline */
        }
      }

      setGlobalParentId(parentId);
      setPortalChildCount(portalChildren);

      const memberships = await orgService.fetchUserMembershipsWithContext();
      setOrganizations(memberships);

      const staffMemberships = memberships.filter((m) => STAFF_ROLES.has(m.role));
      const hasLegacyParentMembership = memberships.some((m) => m.role === 'parent' || m.role === 'guardian');
      const hasParentAccess = portalChildren > 0 || hasLegacyParentMembership;

      setCanAccessParentPortal(hasParentAccess && parentId !== null);

      const parentOnly = staffMemberships.length === 0 && hasParentAccess;
      setIsParentOnly(parentOnly);

      if (parentOnly) {
        setParentPortalActiveState(true);
        setParentPortalModeActive(true);
        orgService.clearStoredOrganizationId();
        applyMembershipSelection(memberships, null);
        return;
      }

      const currentContextMembership = memberships.find((m) => m.isCurrentContext);
      if (currentContextMembership) {
        applyMembershipSelection(memberships, currentContextMembership.id);
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
    } catch (err) {
      console.error('[org] refreshOrganizations failed', err);
      setOrganizations([]);
      applyMembershipSelection([], null);
    } finally {
      setLoading(false);
    }
  }, [user, applySelection, applyMembershipSelection]);

  useEffect(() => {
    refreshOrganizations();
  }, [refreshOrganizations]);

  const selectOrganization = useCallback(
    (organizationId: string) => {
      if (currentOrganization?.id !== organizationId) {
        StorageService.clearOrganization();
      }
      applySelection(organizations, organizationId);
    },
    [organizations, applySelection, currentOrganization?.id]
  );

  const switchMembership = useCallback(
    async (membershipId: string) => {
      const membership = organizations.find((m) => m.id === membershipId);
      if (!membership) {
        throw new Error('Membership not found');
      }

      if (currentOrganization?.id !== membership.organizationId) {
        StorageService.clearOrganization();
      }

      try {
        await orgService.setActiveMembership(membershipId);
        applyMembershipSelection(organizations, membershipId);
      } catch (error) {
        console.error('Failed to switch membership:', error);
        throw error;
      }
    },
    [organizations, applyMembershipSelection, currentOrganization?.id]
  );

  const clearOrganization = useCallback(async () => {
    try {
      await orgService.clearActiveMembership();
    } catch (error) {
      console.error('Failed to clear active membership:', error);
    }
    orgService.clearStoredOrganizationId();
    setSelectedMembership(null);
    setCurrentOrganization(null);
    setCurrentRole(null);
    setCurrentStaffId(null);
    setCurrentParentCustomerId(null);
    StorageService.clearOrganization();
  }, []);

  const createOrganization = useCallback(
    async (
      name: string,
      industryType: IndustryType | string = 'piano',
      settings?: orgService.CreateOrganizationFormExtras
    ) => {
      const orgId = await orgService.createOrganization(
        orgService.toCreateOrganizationOptions(name, industryType, settings)
      );
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
        memberships: organizations,
        selectedMembership,
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
        switchMembership,
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
