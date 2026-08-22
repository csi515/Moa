import React, { useState } from 'react';
import { Building2, ChevronDown, LogOut, CheckCircle2 } from 'lucide-react';
import { useOptionalAuth } from '../../core/auth/AuthProvider';
import { useOptionalOrganization } from '../../core/organizations/OrganizationProvider';
import { getRoleLabel } from '../../core/organizations/services/organizationService';
import { clearStoredOrganizationId } from '../../core/organizations/services/organizationService';

export const OrganizationSwitcher: React.FC = () => {
  const auth = useOptionalAuth();
  const org = useOptionalOrganization();
  const [open, setOpen] = useState(false);

  if (!auth || !org?.currentOrganization) return null;

  const { organizations, currentOrganization, currentRole, selectOrganization, clearOrganization } = org;

  const handleSwitch = (organizationId: string) => {
    selectOrganization(organizationId);
    setOpen(false);
  };

  const handleLogout = async () => {
    clearStoredOrganizationId();
    setOpen(false);
    await auth.signOut();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer text-left max-w-[180px] sm:max-w-none"
      >
        <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4" />
        </div>
        <div className="hidden sm:block min-w-0">
          <p className="text-xs font-bold text-indigo-950 leading-tight truncate">
            {currentOrganization.name}
          </p>
          {currentRole && (
            <p className="text-[10px] text-indigo-600">{getRoleLabel(currentRole)}</p>
          )}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
            <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
              Organization 전환
            </p>

            {organizations.map((membership) => (
              <button
                key={membership.id}
                onClick={() => handleSwitch(membership.organizationId)}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer mb-1 min-h-[44px] ${
                  membership.organizationId === currentOrganization.id
                    ? 'bg-indigo-50 text-indigo-900 font-bold border border-indigo-200'
                    : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold truncate">{membership.organization.name}</p>
                  <p className="text-[10px] text-slate-500">{getRoleLabel(membership.role)}</p>
                </div>
                {membership.organizationId === currentOrganization.id && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                )}
              </button>
            ))}

            <div className="border-t border-slate-100 mt-2 pt-2 space-y-1">
              <button
                onClick={() => {
                  clearOrganization();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors min-h-[44px]"
              >
                <Building2 className="w-4 h-4" />
                Organization 추가/선택
              </button>
              <p className="text-[10px] text-slate-400 px-3 py-1 truncate">
                {auth.user?.email}
              </p>
              <button
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
