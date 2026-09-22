import React from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { formatKoreanDate } from '@/utils/formatters';
import { RoleContextSwitcher } from '@/core/organizations/RoleContextSwitcher';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { useStorageRefresh } from '@/hooks/useStorageRefresh';
import { Layers, Users } from 'lucide-react';

export const Header: React.FC = () => {
  const { setActiveTab } = useApp();
  const supabaseOrg = useOptionalOrganization();
  const canEnterParentPortal =
    supabaseOrg?.canAccessParentPortal &&
    !supabaseOrg.isParentOnly &&
    !supabaseOrg.parentPortalActive;

  // 설정 저장 후 로컬 사업장명 재조회 (students 등 타 domain 무시)
  useStorageRefresh('settings');
  const settingsName = StorageService.getSettings().name?.trim();
  const displayName =
    settingsName ||
    supabaseOrg?.currentOrganization?.name ||
    '사업장';

  const todayStr = formatKoreanDate(new Date().toISOString());

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 min-w-0 text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            aria-label="홈으로 이동"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-indigo-950 tracking-tight truncate hover:text-indigo-700 transition-colors">
                  {displayName}
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  프로
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal hidden md:block">{todayStr}</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {canEnterParentPortal && (
            <button
              type="button"
              onClick={() => supabaseOrg?.enterParentPortal()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 min-h-[44px]"
            >
              <Users className="w-4 h-4" />
              학부모 포털
            </button>
          )}
          <RoleContextSwitcher />
        </div>
      </div>
    </header>
  );
};
