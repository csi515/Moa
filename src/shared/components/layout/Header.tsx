import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { studentMatchesGuardianQuery } from '@/core/parent/guardianHelpers';
import { StorageService } from '@/services/storage';
import { formatKoreanDate } from '@/utils/formatters';
import { PwaInstallPrompt } from '@/shared/components/PwaInstallPrompt';
import { OrganizationSwitcher } from '@/core/organizations/OrganizationSwitcher';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { HeaderBackupButton } from '@/core/backup';
import { Search, Music, Shield, Users } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    globalSearchQuery,
    setGlobalSearchQuery,
    setSelectedStudentId,
  } = useApp();

  const settings = StorageService.getSettings();
  const supabaseOrg = useOptionalOrganization();
  const { roleLabel, isStaff, staffId } = usePermissions();
  const canEnterParentPortal =
    supabaseOrg?.canAccessParentPortal &&
    !supabaseOrg.isParentOnly &&
    !supabaseOrg.parentPortalActive;
  const displayName = supabaseOrg?.currentOrganization?.name ?? settings.name;

  const todayStr = formatKoreanDate(new Date().toISOString());

  const handleSelectStudentSearchResult = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
    setGlobalSearchQuery('');
  };

  const filteredStudents = globalSearchQuery.trim()
    ? StorageService.getStudents()
        .filter(
          (s) =>
            (!isStaff || !staffId || s.teacherId === staffId) &&
            (s.name.includes(globalSearchQuery) ||
            studentMatchesGuardianQuery(s.id, globalSearchQuery) ||
            s.school.includes(globalSearchQuery) ||
            s.level.includes(globalSearchQuery))
        )
        .slice(0, 5)
    : [];

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const searchResultsDropdown = globalSearchQuery.trim() ? (
    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
      <p className="text-[11px] font-bold text-slate-400 px-3 py-1 uppercase tracking-wider">
        원생 검색 결과 ({filteredStudents.length})
      </p>
      {filteredStudents.length === 0 ? (
        <p className="text-xs text-slate-500 p-3 text-center">일치하는 원생이 없습니다.</p>
      ) : (
        filteredStudents.map((st) => (
          <button
            key={st.id}
            onClick={() => {
              handleSelectStudentSearchResult(st.id);
              setMobileSearchOpen(false);
            }}
            className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50 flex items-center justify-between text-xs transition-colors cursor-pointer min-h-[44px]"
          >
            <div>
              <span className="font-bold text-slate-900">{st.name}</span>
              <span className="ml-2 text-slate-500">
                {st.school} {st.grade}
              </span>
              <span className="ml-2 text-indigo-600 font-medium">[{st.level}]</span>
            </div>
            <div className="text-slate-400 font-mono">{st.parentPhone}</div>
          </button>
        ))
      )}
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-none">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-indigo-950 tracking-tight truncate">{displayName}</h1>
              <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal hidden md:block">{todayStr}</p>
          </div>
        </div>

        <div className="flex-1 max-w-md relative hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="원생 이름, 학부모 연락처, 학교, 레벨 검색..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 min-h-[44px]"
              >
                지우기
              </button>
            )}
          </div>
          {searchResultsDropdown}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileSearchOpen((v) => !v)}
            className="sm:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
            aria-label="원생 검색"
          >
            <Search className="w-5 h-5" />
          </button>
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
          <OrganizationSwitcher />
          <HeaderBackupButton />
          <PwaInstallPrompt />

          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-600 text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-600 font-semibold">{roleLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="sm:hidden max-w-[1600px] mx-auto mt-3 relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              autoFocus
              placeholder="원생 이름, 학부모 연락처 검색..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
          {searchResultsDropdown}
        </div>
      )}
    </header>
  );
};
