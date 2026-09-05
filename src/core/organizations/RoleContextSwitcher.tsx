import React, { useState, useMemo } from 'react';
import {
  Building2,
  ChevronDown,
  LogOut,
  CheckCircle2,
  Users,
  Briefcase,
  GraduationCap,
  UserRound,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useOptionalAuth } from '../auth/AuthProvider';
import { useOptionalOrganization } from './OrganizationProvider';
import { getRoleLabel } from './services/organizationService';
import type { MemberRole } from '@/lib/supabase';

interface MembershipGroup {
  organizationId: string;
  organizationName: string;
  memberships: Array<{
    id: string;
    role: MemberRole;
    organizationId: string;
    isCurrentContext: boolean;
  }>;
}

/** 사업장·역할 전환 + 내 계정 + 로그아웃 통합 메뉴 */
export const RoleContextSwitcher: React.FC = () => {
  const auth = useOptionalAuth();
  const org = useOptionalOrganization();
  const { currentUser, setActiveTab } = useApp();
  const [open, setOpen] = useState(false);

  if (!auth || !org?.memberships || org.memberships.length === 0) return null;

  const { memberships, selectedMembership, switchMembership, clearOrganization } = org;

  const groupedMemberships = useMemo(() => {
    const groups = new Map<string, MembershipGroup>();

    memberships.forEach((membership) => {
      const orgId = membership.organizationId;
      if (!groups.has(orgId)) {
        groups.set(orgId, {
          organizationId: orgId,
          organizationName: membership.organization.name,
          memberships: [],
        });
      }
      groups.get(orgId)!.memberships.push({
        id: membership.id,
        role: membership.role,
        organizationId: membership.organizationId,
        isCurrentContext: membership.isCurrentContext ?? false,
      });
    });

    return Array.from(groups.values());
  }, [memberships]);

  const currentOrgName = selectedMembership?.organization.name ?? '';
  const currentRoleLabel = selectedMembership ? getRoleLabel(selectedMembership.role) : '';
  const displayName = currentUser.name?.trim() || auth.user?.email || '사용자';

  const handleSwitchMembership = async (membershipId: string) => {
    try {
      await switchMembership(membershipId);
      setOpen(false);
    } catch (error) {
      console.error('Failed to switch membership:', error);
    }
  };

  const handleLogout = async () => {
    clearOrganization();
    setOpen(false);
    await auth.signOut();
  };

  const handleOpenAccount = () => {
    setActiveTab('account');
    setOpen(false);
  };

  const getRoleIcon = (role: MemberRole) => {
    if (role === 'owner' || role === 'admin' || role === 'manager') {
      return <Briefcase className="w-3.5 h-3.5" />;
    }
    if (role === 'staff' || role === 'instructor') {
      return <GraduationCap className="w-3.5 h-3.5" />;
    }
    if (role === 'parent' || role === 'guardian') {
      return <Users className="w-3.5 h-3.5" />;
    }
    return <Users className="w-3.5 h-3.5" />;
  };

  const getSectionLabel = (role: MemberRole): string => {
    if (role === 'owner' || role === 'admin' || role === 'manager') {
      return '사업장 관리';
    }
    if (role === 'staff' || role === 'instructor') {
      return '강사 활동';
    }
    if (role === 'member' || role === 'customer') {
      return '내가 다니는 곳';
    }
    if (role === 'parent' || role === 'guardian') {
      return '학부모 포털';
    }
    return '역할';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`계정 · 사업장: ${currentOrgName || '선택'}`}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 min-h-[44px] rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer text-left max-w-[180px] sm:max-w-none"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="hidden sm:block min-w-0">
          <p className="text-xs font-bold text-indigo-950 leading-tight truncate">
            {currentOrgName || '사업장'}
          </p>
          {currentRoleLabel && (
            <p className="text-[10px] text-indigo-600">{currentRoleLabel}</p>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="fixed left-4 right-4 bottom-20 sm:absolute sm:left-auto sm:right-0 sm:bottom-auto sm:mt-2 sm:w-80 max-h-[70vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50"
          >
            <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
              계정 · 사업장
            </p>

            <div className="px-3 py-2.5 mb-1 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
              {auth.user?.email && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{auth.user.email}</p>
              )}
              {currentRoleLabel && (
                <p className="text-[11px] text-indigo-600 font-semibold mt-1">{currentRoleLabel}</p>
              )}
            </div>

            <p className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
              사업장 / 역할
            </p>

            {groupedMemberships.map((group) => (
              <div key={group.organizationId} className="mb-2">
                <p className="text-[11px] font-bold text-slate-600 px-3 py-1">
                  {group.organizationName}
                </p>
                <div className="space-y-1">
                  {group.memberships.map((membership) => {
                    const isSelected = selectedMembership?.id === membership.id;
                    const roleLabel = getRoleLabel(membership.role);
                    const sectionLabel = getSectionLabel(membership.role);
                    const roleIcon = getRoleIcon(membership.role);

                    return (
                      <button
                        key={membership.id}
                        type="button"
                        role="menuitem"
                        onClick={() => handleSwitchMembership(membership.id)}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer min-h-[44px] ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {roleIcon}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold truncate">{roleLabel}</p>
                            <p className="text-[10px] text-slate-500">{sectionLabel}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="border-t border-slate-100 mt-1 pt-2 space-y-1">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  clearOrganization();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[44px]"
              >
                <Building2 className="w-4 h-4" />
                조직 추가/선택
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleOpenAccount}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px]"
              >
                <UserRound className="w-4 h-4" />
                내 계정
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
