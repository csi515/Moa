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
import { useGuardianDeepLinkPortalSync } from './hooks/useGuardianDeepLinkPortalSync';
import {
  deriveSelectionFields,
  resolveMembershipById,
  resolveMembershipByOrganizationId,
  resolveOrganizationBootstrap,
  STAFF_ROLES,
  type MembershipSelectionResult,
} from './resolveOrganizationContext';

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
  /** 선택 SoT — org/role/staff/parentCustomerId 는 여기서 파생 */
  const [selectedMembership, setSelectedMembership] =
    useState<orgService.OrganizationMembership | null>(null);
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

  const {
    currentOrganization,
    currentRole,
    currentStaffId,
    currentParentCustomerId,
  } = deriveSelectionFields(selectedMembership);

  /** 선택 결과 1곳 커밋 (상태 + localStorage 부작용) */
  const commitMembershipSelection = useCallback((result: MembershipSelectionResult) => {
    setSelectedMembership(result.membership);
    if (result.storage.action === 'store') {
      orgService.storeOrganizationId(result.storage.organizationId);
    } else if (result.storage.action === 'clear') {
      orgService.clearStoredOrganizationId();
    }
  }, []);

  const applyMembershipSelection = useCallback(
    (memberships: orgService.OrganizationMembership[], membershipId: string | null) => {
      commitMembershipSelection(resolveMembershipById(memberships, membershipId));
    },
    [commitMembershipSelection]
  );

  const applySelection = useCallback(
    (memberships: orgService.OrganizationMembership[], organizationId: string | null) => {
      commitMembershipSelection(resolveMembershipByOrganizationId(memberships, organizationId));
    },
    [commitMembershipSelection]
  );

  const resetSelection = useCallback(() => {
    setSelectedMembership(null);
  }, []);

  const deactivatePortals = useCallback(() => {
    setParentPortalActiveState(false);
    setParentPortalModeActive(false);
    setCustomerPortalActiveState(false);
    setCustomerPortalModeActive(false);
  }, []);

  const activateParentPortalMode = useCallback(() => {
    setParentPortalActiveState(true);
    setParentPortalModeActive(true);
    setCustomerPortalActiveState(false);
    setCustomerPortalModeActive(false);
  }, []);

  const activateCustomerPortalMode = useCallback(() => {
    setCustomerPortalActiveState(true);
    setCustomerPortalModeActive(true);
    setParentPortalActiveState(false);
    setParentPortalModeActive(false);
  }, []);

  /** 로그아웃 등 — 멤버십 목록·선택·포털 접근 플래그 초기화 (기존 필드만) */
  const resetLoggedOutOrgState = useCallback(() => {
    StorageService.clearOrganization();
    setOrganizations([]);
    resetSelection();
    setGlobalParentId(null);
    setIsParentOnly(false);
    setCanAccessParentPortal(false);
    setPortalChildCount(0);
    setBlockedOwnerOrgIds([]);
  }, [resetSelection]);

  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      resetLoggedOutOrgState();
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
      setOrganizations(memberships);

      const { flags, decision } = resolveOrganizationBootstrap({
        memberships,
        blockedOwnerOrgIds: blockedIds,
        portalChildren,
        parentId,
        parentPortalModeActive: isParentPortalModeActive(),
        storedOrganizationId: orgService.getStoredOrganizationId(),
      });

      setCanAccessParentPortal(flags.canAccessParentPortal);
      setCanAccessCustomerPortal(flags.canAccessCustomerPortal);
      setIsParentOnly(flags.isParentOnly);
      setIsCustomerOnly(flags.isCustomerOnly);

      switch (decision.kind) {
        case 'enter_parent':
          activateParentPortalMode();
          orgService.clearStoredOrganizationId();
          applyMembershipSelection(memberships, null);
          break;
        case 'enter_customer':
          activateCustomerPortalMode();
          applyMembershipSelection(memberships, decision.membershipId);
          break;
        case 'select_membership':
          applyMembershipSelection(memberships, decision.membershipId);
          break;
        case 'select_organization':
          deactivatePortals();
          applySelection(memberships, decision.organizationId);
          break;
        case 'select_organization_or_clear':
          applySelection(memberships, decision.organizationId);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('[org] refreshOrganizations failed', err);
      setOrganizations([]);
      applyMembershipSelection([], null);
    } finally {
      setLoading(false);
    }
  }, [
    user,
    applySelection,
    applyMembershipSelection,
    resetLoggedOutOrgState,
    activateParentPortalMode,
    activateCustomerPortalMode,
    deactivatePortals,
  ]);

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
          deactivatePortals();
        }
        applyMembershipSelection(organizations, membershipId);
      } catch (error) {
        console.error('Failed to switch membership:', error);
        throw error;
      }
    },
    [organizations, applyMembershipSelection, currentOrganization?.id, deactivatePortals]
  );

  const clearOrganization = useCallback(async () => {
    try {
      await orgService.clearActiveMembership();
    } catch (error) {
      console.error('Failed to clear active membership:', error);
    }
    orgService.clearStoredOrganizationId();
    resetSelection();
    StorageService.clearOrganization();
  }, [resetSelection]);

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
    setSelectedMembership((prev) =>
      prev?.organizationId === organizationId
        ? { ...prev, organization: { ...prev.organization, name: nextName } }
        : prev
    );
  }, []);

  const enterParentPortal = useCallback(() => {
    activateParentPortalMode();
    // 이중 역할: staff org 컨텍스트가 포털 푸시/스토리지에 남지 않도록 해제
    orgService.clearStoredOrganizationId();
    applyMembershipSelection(organizations, null);
  }, [organizations, applyMembershipSelection, activateParentPortalMode]);

  useGuardianDeepLinkPortalSync(user?.id, enterParentPortal);

  const exitParentPortal = useCallback(() => {
    setParentPortalActiveState(false);
    setParentPortalModeActive(false);
  }, []);

  const enterCustomerPortal = useCallback(() => {
    activateCustomerPortalMode();
  }, [activateCustomerPortalMode]);

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
