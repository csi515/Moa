import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { studentMatchesGuardianQuery } from '@/core/parent/guardianHelpers';
import { StorageService } from '@/services/storage';
import {
  formatSessionTime,
  getSessionStatusLabel,
} from '../services/attendanceService';
import type { AttendanceSession } from '../types';
import { PinCheckInKioskView } from './PinCheckInKioskView';
import { PageHeader, SummaryMetricCard, FilterBar, SearchField, EmptyState } from '@/shared/components';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { getCustomerListTab, getIndustryAccent } from '@/core/industry/industryUi';
import { useModuleLabels } from '@/core/labels';
import type { Student } from '@/types';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import { AttendanceMemoModal } from './AttendanceMemoModal';

type AttendanceSubTab = 'overview' | 'kiosk';

const ATTENDANCE_SUB_TABS: { value: AttendanceSubTab; label: string }[] = [
  { value: 'overview', label: '현황' },
  { value: 'kiosk', label: '키패드' },
];

export const AttendanceManagementView: React.FC = () => {
  const { setSelectedStudentId, setActiveTab, showToast, triggerRefresh } = useApp();
  const { attendanceEnabled, industry } = usePermissions();
  const labels = useModuleLabels();
  const { isScoped, scopeStudents } = useStaffScope();
  const refreshKey = useStorageRefresh();

  const accent = getIndustryAccent(industry);
  const accentActive = `${accent.btn} text-white`;
  const linkHover = accent.icon.replace('text-', 'hover:text-');
  const metricVariant =
    industry === 'pilates'
      ? 'teal'
      : industry === 'gym'
        ? 'amber'
        : industry === 'daycare'
          ? 'indigo'
          : 'indigo';
  const customerTab = getCustomerListTab(industry);
  const isDaycare = industry === 'daycare';

  const [subTab, setSubTab] = useState<AttendanceSubTab>('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [memoTarget, setMemoTarget] = useState<{
    student: Student;
    session?: AttendanceSession;
  } | null>(null);
  const [memoDraft, setMemoDraft] = useState('');

  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()),
    [scopeStudents, refreshKey]
  );
  const sessions = useMemo(() => StorageService.getAttendanceSessions(), [refreshKey]);

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
      return s.name.toLowerCase().includes(q) || studentMatchesGuardianQuery(s.id, searchQuery);
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

  const openMemoEditor = (student: Student, session?: AttendanceSession) => {
    setMemoTarget({ student, session });
    setMemoDraft(session?.memo || '');
  };

  const saveMemo = () => {
    if (!memoTarget) return;
    const now = new Date().toISOString();
    const existing = memoTarget.session;
    if (existing) {
      StorageService.saveAttendanceSession({
        ...existing,
        memo: memoDraft.trim() || undefined,
        updatedAt: now,
      });
    } else {
      StorageService.saveAttendanceSession({
        id: `att-sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customerId: memoTarget.student.id,
        customerName: memoTarget.student.name,
        sessionDate: selectedDate,
        memo: memoDraft.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      });
    }
    showToast('하원·전달 메모를 저장했습니다.', 'success');
    setMemoTarget(null);
    triggerRefresh();
  };

  if (!attendanceEnabled) {
    return (
      <EmptyState
        icon={<CheckSquare className="w-10 h-10" />}
        title="출입 관리가 꺼져 있습니다"
        description="설정에서 출입 관리(핀번호)를 활성화하면 PIN 입·퇴실 기록을 사용할 수 있습니다."
        action={
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-white text-xs font-bold ${accent.btn} ${accent.btnHover}`}
          >
            <Settings className="w-4 h-4" />
            설정으로 이동
          </button>
        }
        className="border-amber-200 bg-amber-50/30"
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<CheckSquare className="w-6 h-6" />}
        iconClassName={accent.icon}
        title={isDaycare ? '등·하원 관리' : '출입 관리'}
        description={
          isDaycare
            ? 'PIN 등하원 기록, 알레르기 확인, 하원 메모'
            : 'PIN 입·퇴실 기록 및 날짜별 현황 확인'
        }
        actions={
          <SegmentedControl
            value={subTab}
            options={ATTENDANCE_SUB_TABS}
            onChange={setSubTab}
            activeClassName={accentActive}
            aria-label="출입 관리 보기"
            fullWidth
            className="sm:w-auto"
          />
        }
      />

      {subTab === 'kiosk' ? (
        <div id="attendance-panel-kiosk" role="tabpanel" aria-labelledby="segment-kiosk">
          <PinCheckInKioskView />
        </div>
      ) : (
        <div id="attendance-panel-overview" role="tabpanel" aria-labelledby="segment-overview">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryMetricCard label="재원생" value={`${stats.total}명`} variant={metricVariant} />
            <SummaryMetricCard
              label={isDaycare ? '등원' : '입실'}
              value={`${stats.checkedIn}명`}
              variant="emerald"
            />
            <SummaryMetricCard
              label={isDaycare ? '하원' : '퇴실'}
              value={`${stats.checkedOut}명`}
              variant="amber"
            />
            <SummaryMetricCard label="미출석" value={`${stats.absent}명`} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <FilterBar className="border-0 shadow-none rounded-none border-b border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => changeDate(-1)}
                  className="p-2 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-50"
                  aria-label="이전 날짜"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="flex-1 sm:flex-none px-3 py-2 min-h-[44px] text-sm font-bold border border-slate-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => changeDate(1)}
                  className="p-2 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-50"
                  aria-label="다음 날짜"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="이름·연락처 검색"
                className="w-full sm:flex-1 sm:max-w-xs"
              />
            </FilterBar>

            {activeStudents.length === 0 ? (
              <EmptyState
                icon={<Users className="w-10 h-10" />}
                title={isScoped ? '담당 원생이 없습니다' : '등록된 재원생이 없습니다'}
                description={
                  searchQuery.trim()
                    ? '검색 조건에 맞는 재원생이 없습니다.'
                    : '원생을 등록하면 출입 현황을 확인할 수 있습니다.'
                }
                action={
                  !searchQuery.trim() && !isScoped ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(null);
                        setActiveTab(customerTab);
                      }}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl text-white text-xs font-bold ${accent.btn} ${accent.btnHover}`}
                    >
                      <UserPlus className="w-4 h-4" />
                      {labels.customer.add}
                    </button>
                  ) : undefined
                }
                className="border-0 shadow-none rounded-none"
              />
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500">
                        <th className="text-left px-4 py-3 font-bold">이름</th>
                        <th className="text-left px-4 py-3 font-bold">상태</th>
                        <th className="text-left px-4 py-3 font-bold">{isDaycare ? '등원' : '입실'}</th>
                        <th className="text-left px-4 py-3 font-bold">{isDaycare ? '하원' : '퇴실'}</th>
                        <th className="text-left px-4 py-3 font-bold">PIN</th>
                        <th className="text-left px-4 py-3 font-bold">메모</th>
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
                                  setActiveTab(customerTab);
                                }}
                                className={`font-bold text-slate-900 ${linkHover}`}
                              >
                                {student.name}
                              </button>
                              <p className="text-[10px] text-slate-400">{student.grade}</p>
                              {student.specialNotes && (
                                <p className="mt-1 text-[10px] font-semibold text-amber-800 bg-amber-50 rounded-lg px-1.5 py-0.5 inline-block max-w-[14rem] truncate">
                                  주의 · {student.specialNotes}
                                </p>
                              )}
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
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => openMemoEditor(student, session)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-indigo-600 min-h-[44px]"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                {session?.memo ? '수정' : '작성'}
                              </button>
                              {session?.memo && (
                                <p className="text-[10px] text-slate-400 mt-0.5 max-w-[10rem] truncate">
                                  {session.memo}
                                </p>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100">
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
                      <div key={student.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setActiveTab(customerTab);
                            }}
                            className={`font-bold text-slate-900 ${linkHover} text-sm text-left min-h-[44px]`}
                          >
                            {student.name}
                          </button>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 ${toneBg}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{student.grade}</p>
                        {student.specialNotes && (
                          <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 rounded-xl px-2 py-1.5">
                            주의 · {student.specialNotes}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 rounded-xl p-2">
                            <p className="text-slate-400 font-semibold">{isDaycare ? '등원' : '입실'}</p>
                            <p className="font-mono font-bold text-slate-700">
                              {formatSessionTime(session?.checkInAt)}
                            </p>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-2">
                            <p className="text-slate-400 font-semibold">{isDaycare ? '하원' : '퇴실'}</p>
                            <p className="font-mono font-bold text-slate-700">
                              {formatSessionTime(session?.checkOutAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-[11px] font-bold ${pinSet ? 'text-emerald-600' : 'text-rose-500'}`}>
                            PIN {pinSet ? '설정됨' : '미설정'}
                          </p>
                          <button
                            type="button"
                            onClick={() => openMemoEditor(student, session)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 min-h-[44px]"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {session?.memo ? '메모 수정' : '하원 메모'}
                          </button>
                        </div>
                        {session?.memo && (
                          <p className="text-[11px] text-slate-500">메모 · {session.memo}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <AttendanceMemoModal
        open={Boolean(memoTarget)}
        student={memoTarget?.student ?? null}
        session={memoTarget?.session}
        draft={memoDraft}
        onDraftChange={setMemoDraft}
        onClose={() => setMemoTarget(null)}
        onSave={saveMemo}
        saveButtonClassName={accent.btn}
      />
    </div>
  );
};
