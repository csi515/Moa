import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import type { Student } from '@/types';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '../services/attendanceService';
import type { AttendanceSession } from '../types';
import { PinCheckInKioskView } from './PinCheckInKioskView';
import {
  Calendar,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Users,
} from 'lucide-react';

type AttendanceSubTab = 'overview' | 'kiosk';

export const AttendanceManagementView: React.FC = () => {
  const { setSelectedStudentId, setActiveTab } = useApp();
  const { isScoped, scopeStudents } = useStaffScope();

  const [subTab, setSubTab] = useState<AttendanceSubTab>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');

  const students = useMemo(() => scopeStudents(StorageService.getStudents()), [scopeStudents]);
  const sessions = StorageService.getAttendanceSessions();

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const sessionMap = useMemo(() => {
    const map = new Map<string, AttendanceSession>();
    sessions
      .filter((s) => s.sessionDate === selectedDate)
      .forEach((s) => map.set(s.customerId, s));
    return map;
  }, [sessions, selectedDate]);

  const activeStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== 'active') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.parentPhone.includes(q);
    });
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    let checkedIn = 0;
    let checkedOut = 0;
    activeStudents.forEach((s) => {
      const sess = sessionMap.get(s.id);
      if (sess?.checkInAt) checkedIn++;
      if (sess?.checkOutAt) checkedOut++;
    });
    return {
      total: activeStudents.length,
      checkedIn,
      checkedOut,
      absent: activeStudents.length - checkedIn,
    };
  }, [activeStudents, sessionMap]);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            출결 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            PIN 입·퇴실 기록 및 날짜별 현황 확인
          </p>
        </div>

        <div className="flex bg-white border border-slate-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setSubTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold ${
              subTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-600'
            }`}
          >
            현황
          </button>
          <button
            type="button"
            onClick={() => setSubTab('kiosk')}
            className={`px-4 py-2 rounded-lg text-xs font-bold ${
              subTab === 'kiosk' ? 'bg-indigo-600 text-white' : 'text-slate-600'
            }`}
          >
            키패드
          </button>
        </div>
      </div>

      {subTab === 'kiosk' ? (
        <PinCheckInKioskView />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="재원생" value={stats.total} icon={<Users className="w-4 h-4" />} />
            <StatCard label="입실" value={stats.checkedIn} tone="success" icon={<Clock className="w-4 h-4" />} />
            <StatCard label="퇴실" value={stats.checkedOut} tone="warning" icon={<CheckSquare className="w-4 h-4" />} />
            <StatCard label="미출석" value={stats.absent} tone="muted" icon={<Calendar className="w-4 h-4" />} />
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeDate(-1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                  aria-label="이전 날짜"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => changeDate(1)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"
                  aria-label="다음 날짜"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="이름·연락처 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="text-left px-4 py-3 font-bold">이름</th>
                    <th className="text-left px-4 py-3 font-bold">상태</th>
                    <th className="text-left px-4 py-3 font-bold">입실</th>
                    <th className="text-left px-4 py-3 font-bold">퇴실</th>
                    <th className="text-left px-4 py-3 font-bold">PIN</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudents.map((student) => {
                    const session = sessionMap.get(student.id);
                    const status = getSessionStatusLabel(session);
                    const pinSet = StorageService.hasCustomerPin(student.id);
                    const toneBg =
                      status.tone === 'success'
                        ? 'bg-emerald-50 text-emerald-700'
                        : status.tone === 'warning'
                          ? 'bg-amber-50 text-amber-700'
                          : status.tone === 'error'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600';

                    return (
                      <tr key={student.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setActiveTab('students');
                            }}
                            className="font-bold text-slate-900 hover:text-indigo-600"
                          >
                            {student.name}
                          </button>
                          <p className="text-[10px] text-slate-400">{student.grade}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${toneBg}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {formatSessionTime(session?.checkInAt)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {formatSessionTime(session?.checkOutAt)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold ${pinSet ? 'text-emerald-600' : 'text-rose-500'}`}
                          >
                            {pinSet ? '설정됨' : '미설정'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {activeStudents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                        {isScoped ? '담당 원생이 없습니다.' : '등록된 재원생이 없습니다.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function StatCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'muted';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-600'
      : tone === 'warning'
        ? 'text-amber-600'
        : tone === 'muted'
          ? 'text-slate-500'
          : 'text-indigo-600';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className={`flex items-center gap-2 ${toneClass}`}>
        {icon}
        <span className="text-[10px] font-bold uppercase">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900 mt-2">{value}</p>
    </div>
  );
}
