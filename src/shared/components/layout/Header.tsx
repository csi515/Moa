import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { formatKoreanDate } from '@/utils/formatters';
import { PwaInstallPrompt } from '@/shared/components/PwaInstallPrompt';
import { OrganizationSwitcher } from '@/core/organizations/OrganizationSwitcher';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { Bell, Search, Music, Shield } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentUser,
    setActiveTab,
    globalSearchQuery,
    setGlobalSearchQuery,
    setSelectedStudentId,
  } = useApp();

  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const settings = StorageService.getSettings();
  const notifications = StorageService.getNotifications();
  const pendingNotifs = notifications.filter((n) => n.status === 'pending');
  const supabaseOrg = useOptionalOrganization();
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
            s.name.includes(globalSearchQuery) ||
            s.parentPhone.includes(globalSearchQuery) ||
            s.school.includes(globalSearchQuery) ||
            s.level.includes(globalSearchQuery)
        )
        .slice(0, 5)
    : [];

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-xs">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-indigo-950 tracking-tight">{displayName}</h1>
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
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
            />
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                지우기
              </button>
            )}
          </div>

          {globalSearchQuery.trim() && (
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
                    onClick={() => handleSelectStudentSearchResult(st.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
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
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <OrganizationSwitcher />
          <PwaInstallPrompt />

          <div className="relative">
            <button
              onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
              className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="알림 센터"
            >
              <Bell className="w-5 h-5" />
              {pendingNotifs.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {notifDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <h4 className="font-bold text-sm text-slate-900">알림 센터</h4>
                  <button
                    onClick={() => {
                      setNotifDropdownOpen(false);
                      setActiveTab('notifications');
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    전체보기
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.slice(0, 4).map((n) => (
                    <div key={n.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <p className="font-bold text-slate-800">{n.title}</p>
                      <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                        <span>{n.scheduledDate}</span>
                        <span
                          className={
                            n.status === 'sent'
                              ? 'text-emerald-600 font-semibold'
                              : 'text-amber-600 font-semibold'
                          }
                        >
                          {n.status === 'sent' ? '발송완료' : '대기중'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-600 text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-indigo-600 font-semibold">원장</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
