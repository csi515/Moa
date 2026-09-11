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
import {
  listBlockedOwnerOrganizations,
  saveOrganizationBusinessStatus,
} from '../auth/services/ownerBusinessGate';
import type { Organization, MemberRole } from '../../lib/supabase';
import { StorageService } from '../../services/storage';
import { runLoginAccountSync } from '../accounts/loginBootstrapService';
import { applyOAuthSignupIntentIfAny } from '../auth/services/oauthSignupService';
import { ensureGlobalParentProfile, fetchParentPortalTree } from '../parent/services/parentPortalService';
import {
  isCustomerPortalModeActive,
  isParentPortalModeActive,
  setCustomerPortalModeActive,
  setParentPortalModeActive,
} from '../parent/services/appModeService';
import * as orgService from './services/organizationService';
import { GUARDIAN_LINK_PENDING_EVENT } from '@/core/platform/bootstrapDeepLinks';
import { peekPendingGuardianLink } from '@/core/parent/services/guardianLinkService';

const STAFF_ROLES = new Set(['owner', 'admin', 'manager', 'staff', 'instructor']);
const CUSTOMER_ROLES = new Set(['customer', 'member']);

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
  isCustomerOnly: boolean;
  canAccessParentPortal: boolean;
  canAccessCustomerPortal: boolean;
  parentPortalActive: boolean;
  customerPortalActive: boolean;
  portalChildCount: number;
  blockedOwnerOrgIds: string[];
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
  /** 설정 저장 직후 헤더·사업장 선택 UI에 이름 반영 */
  patchOrganization: (organizationId: string, patch: { name: string }) => void;
  enterParentPortal: () => void;
  exitParentPortal: () => void;
  enterCustomerPortal: () => void;
  exitCustomerPortal: () => void;
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
  const [isCustomerOnly, setIsCustomerOnly] = useState(false);
  const [canAccessParentPortal, setCanAccessParentPortal] = useState(false);
  const [canAccessCustomerPortal, setCanAccessCustomerPortal] = useState(false);
  const [portalChildCount, setPortalChildCount] = useState(0);
  const [blockedOwnerOrgIds, setBlockedOwnerOrgIds] = useState<string[]>([]);
  const [parentPortalActive, setParentPortalActiveState] = useState(isParentPortalModeActive);
  const [customerPortalActive, setCustomerPortalActiveState] = useState(isCustomerPortalModeActive);
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
      setBlockedOwnerOrgIds([]);
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
      const ownerOrgIds = memberships.filter((m) => m.role === 'owner').map((m) => m.organizationId);
      let blockedIds: string[] = [];
      if (ownerOrgIds.length > 0) {
        try {
          blockedIds = await listBlockedOwnerOrganizations(ownerOrgIds);
        } catch {
          blockedIds = [];
        }
      }
      setBlockedOwnerOrgIds(blockedIds);
      const blocked = new Set(blockedIds);
      const isBlockedOwner = (membership: orgService.OrganizationMembership) =>
        membership.role === 'owner' && blocked.has(membership.organizationId);

      setOrganizations(memberships);

      const staffMemberships = memberships.filter(
        (m) => STAFF_ROLES.has(m.role) && !isBlockedOwner(m)
      );
      const customerMemberships = memberships.filter((m) => CUSTOMER_ROLES.has(m.role));
      const hasLegacyParentMembership = memberships.some((m) => m.role === 'parent' || m.role === 'guardian');
      const hasParentAccess = portalChildren > 0 || hasLegacyParentMembership;

      setCanAccessParentPortal(hasParentAccess && parentId !== null);
      setCanAccessCustomerPortal(customerMemberships.length > 0);

      const parentOnly = staffMemberships.length === 0 && hasParentAccess && customerMemberships.length === 0;
      const customerOnly =
        staffMemberships.length === 0 && !hasParentAccess && customerMemberships.length > 0;
      setIsParentOnly(parentOnly);
      setIsCustomerOnly(customerOnly);

      const enterCustomer = () => {
        setCustomerPortalActiveState(true);
        setCustomerPortalModeActive(true);
        setParentPortalActiveState(false);
        setParentPortalModeActive(false);
        const preferred =
          customerMemberships.find((m) => m.isCurrentContext) || customerMemberships[0];
        applyMembershipSelection(memberships, preferred.id);
      };

      const enterParent = () => {
        setParentPortalActiveState(true);
        setParentPortalModeActive(true);
        setCustomerPortalActiveState(false);
        setCustomerPortalModeActive(false);
        orgService.clearStoredOrganizationId();
        applyMembershipSelection(memberships, null);
      };

      // OAuth/딥링크 후 학부모 연결 대기 중이면 포털로 진입 (자녀 0명이어도 등록·연결 가능)
      if (isParentPortalModeActive() && parentId !== null) {
        enterParent();
        return;
      }

      if (staffMemberships.length === 0 && customerMemberships.length > 0) {
        enterCustomer();
        return;
      }

      if (parentOnly) {
        enterParent();
        return;
      }

      if (customerOnly) {
        enterCustomer();
        return;
      }

      const currentContextMembership = memberships.find((m) => m.isCurrentContext);
      if (currentContextMembership && !isBlockedOwner(currentContextMembership)) {
        applyMembershipSelection(memberships, currentContextMembership.id);
        return;
      }

      if (staffMemberships.length === 0) {
        const blockedOwner = memberships.find((m) => isBlockedOwner(m));
        if (blockedOwner) {
          setParentPortalActiveState(false);
          setParentPortalModeActive(false);
          setCustomerPortalActiveState(false);
          setCustomerPortalModeActive(false);
          applySelection(memberships, blockedOwner.organizationId);
          return;
        }
      }

      const storedId = orgService.getStoredOrganizationId();
      const storedMembership = storedId
        ? memberships.find((m) => m.organizationId === storedId)
        : undefined;
      const storedUsable = storedMembership && !isBlockedOwner(storedMembership);
      const autoId = storedUsable
        ? storedId
        : staffMemberships.length === 1
          ? staffMemberships[0].organizationId
          : null;

      applySelection(memberships, autoId ?? null);
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
        throw new Error('소속 정보를 찾을 수 없습니다.');
      }

      if (currentOrganization?.id !== membership.organizationId) {
        StorageService.clearOrganization();
      }

      try {
        await orgService.setActiveMembership(membershipId);
        if (STAFF_ROLES.has(membership.role)) {
          setParentPortalActiveState(false);
          setParentPortalModeActive(false);
          setCustomerPortalActiveState(false);
          setCustomerPortalModeActive(false);
        }
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
      if (settings?.businessNumber) {
        await saveOrganizationBusinessStatus(orgId, '01');
      }
      await refreshOrganizations();
      selectOrganization(orgId);
    },
    [refreshOrganizations, selectOrganization]
  );

  const patchOrganization = useCallback((organizationId: string, patch: { name: string }) => {
    const nextName = patch.name.trim();
    if (!nextName) return;

    setOrganizations((prev) =>
      prev.map((m) =>
        m.organizationId === organizationId
          ? { ...m, organization: { ...m.organization, name: nextName } }
          : m
      )
    );
    setCurrentOrganization((prev) =>
      prev?.id === organizationId ? { ...prev, name: nextName } : prev
    );
    setSelectedMembership((prev) =>
      prev?.organizationId === organizationId
        ? { ...prev, organization: { ...prev.organization, name: nextName } }
        : prev
    );
  }, []);

  const enterParentPortal = useCallback(() => {
    setParentPortalActiveState(true);
    setParentPortalModeActive(true);
    setCustomerPortalActiveState(false);
    setCustomerPortalModeActive(false);
    // 이중 역할: staff org 컨텍스트가 포털 푸시/스토리지에 남지 않도록 해제
    orgService.clearStoredOrganizationId();
    applyMembershipSelection(organizations, null);
  }, [organizations, applyMembershipSelection]);

  // 로그인 중 보호자 딥링크 → React 포털 상태 동기화
  useEffect(() => {
    if (!user) return;
    const enterIfPending = () => {
      if (peekPendingGuardianLink() || isParentPortalModeActive()) {
        enterParentPortal();
      }
    };
    enterIfPending();
    window.addEventListener(GUARDIAN_LINK_PENDING_EVENT, enterIfPending);
    return () => window.removeEventListener(GUARDIAN_LINK_PENDING_EVENT, enterIfPending);
  }, [user, enterParentPortal]);

  const exitParentPortal = useCallback(() => {
    setParentPortalActiveState(false);
    setParentPortalModeActive(false);
  }, []);

  const enterCustomerPortal = useCallback(() => {
    setCustomerPortalActiveState(true);
    setCustomerPortalModeActive(true);
    setParentPortalActiveState(false);
    setParentPortalModeActive(false);
  }, []);

  const exitCustomerPortal = useCallback(() => {
    setCustomerPortalActiveState(false);
    setCustomerPortalModeActive(false);
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
        isCustomerOnly,
        canAccessParentPortal,
        canAccessCustomerPortal,
        parentPortalActive,
        customerPortalActive,
        portalChildCount,
        blockedOwnerOrgIds,
        loading,
        selectOrganization,
        switchMembership,
        clearOrganization,
        createOrganization,
        refreshOrganizations,
        patchOrganization,
        enterParentPortal,
        exitParentPortal,
        enterCustomerPortal,
        exitCustomerPortal,
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
