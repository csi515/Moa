import type { User } from '@supabase/supabase-js';
import type { OrganizationMembership } from '@/core/organizations/services/organizationService';
import { getAccountTypeFromUser } from '../services/authService';

const STAFF_ROLES = new Set(['owner', 'admin', 'manager', 'staff']);

export function needsAccountTypeOnboarding(options: {
  user: User | null;
  organizations: OrganizationMembership[];
  portalChildCount: number;
  orgLoading: boolean;
}): boolean {
  const { user, organizations, portalChildCount, orgLoading } = options;
  if (!user || orgLoading) return false;
  if (getAccountTypeFromUser(user)) return false;

  const staffMemberships = organizations.filter((membership) =>
    STAFF_ROLES.has(membership.role)
  );
  if (staffMemberships.length > 0) return false;
  if (portalChildCount > 0) return false;

  return true;
}
