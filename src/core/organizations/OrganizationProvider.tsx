import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import type { Organization, MemberRole } from '../../lib/supabase';
import { StorageService } from '../../services/storage';
import { connectStaffOnLogin } from '../staff/services/staffAccountService';
import { connectParentOnLogin } from '../parent/services/parentAccountService';
import * as orgService from './services/organizationService';

interface OrganizationContextType {
  organizations: orgService.OrganizationMembership[];
  currentOrganization: Organization | null;
  currentRole: MemberRole | null;
  currentStaffId: string | null;
  currentParentCustomerId: string | null;
  loading: boolean;
  selectOrganization: (organizationId: string) => void;
  clearOrganization: () => void;
  createOrganization: (name: string, industryType?: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<orgService.OrganizationMembership[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [currentRole, setCurrentRole] = useState<MemberRole | null>(null);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [currentParentCustomerId, setCurrentParentCustomerId] = useState<string | null>(null);
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
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // pending 초대를 로그인 계정에 연결
      await connectStaffOnLogin();
      await connectParentOnLogin();

      const memberships = await orgService.fetchUserOrganizations(user.id);
      setOrganizations(memberships);

      const storedId = orgService.getStoredOrganizationId();
      const autoId =
        storedId && memberships.some((m) => m.organizationId === storedId)
          ? storedId
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

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        currentRole,
        currentStaffId,
        currentParentCustomerId,
        loading,
        selectOrganization,
        clearOrganization,
        createOrganization,
        refreshOrganizations,
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

/** OrganizationProvider 외부에서도 안전하게 사용 (localStorage 모드) */
export function useOptionalOrganization(): OrganizationContextType | null {
  return useContext(OrganizationContext) ?? null;
}
