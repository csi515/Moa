import type { FC } from 'react';
import type { NavTab } from '@/context/AppContext';
import { formatCurrency, formatKoreanDate } from '@/utils/formatters';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CheckSquare,
  Clock,
  Inbox,
  MessageSquareText,
  Piano,
  UserPlus,
  Users,
  ChevronRight,
} from 'lucide-react';
import type { useDirectorTodayDashboard } from './useDirectorTodayDashboard';

type TodayData = ReturnType<typeof useDirectorTodayDashboard>;

interface DirectorTodayHomeProps {
  currentUserName: string;
  data: TodayData;
  setActiveTab: (tab: NavTab) => void;
}

function formatReservationTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** 원장 홈 — 오늘 일정을 fold에 두는 고밀도 레이아웃 */
export const DirectorTodayHome: FC<DirectorTodayHomeProps> = ({
  currentUserName,
  data,
  setActiveTab,
}) => {
  const {
    stats,
    students,
    todayClasses,
    recentUnpaid,
    unpaidStudentCount,
    unpaidTotal,
    pendingReservations,
    pendingReservationCount,
    makeupPendingCount,
  } = data;

  const isEmpty = stats.activeStudents === 0 && stats.todayClassesCount === 0;
  const nowHm = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

  const kpiChips: { label: string; value: string; tab: NavTab; tone: string }[] = [
    {
      label: '수업',
      value: `${stats.todayClassesCount}`,
      tab: 'timetable',
      tone: 'bg-indigo-50 text-indigo-800 border-indigo-100',
    },
    {
      label: '출석',
      value: `${stats.todayPresent}`,
      tab: 'attendance',
      tone: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    },
    {
      label: '미출',
      value: `${stats.todayAbsent}`,
      tab: makeupPendingCount > 0 ? 'makeups' : 'attendance',
      tone: 'bg-amber-50 text-amber-800 border-amber-100',
    },
    {
      label: '상담',
      value: `${pendingReservationCount}`,
      tab: 'consultations',
      tone: 'bg-violet-50 text-violet-800 border-violet-100',
    },
    {
      label: '미납',
      value: `${unpaidStudentCount}`,
      tab: 'unpaid',
      tone: 'bg-rose-50 text-rose-800 border-rose-100',
    },
  ];

  return (
    <div className="space-y-4 pb-4">
      <section className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 rounded-2xl px-4 py-3 text-white">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-indigo-200 font-semibold">
              {formatKoreanDate(new Date().toISOString())}
            </p>
            <h2 className="text-lg font-bold tracking-tight truncate">
              안녕하세요, {currentUserName}님
            </h2>
            {isEmpty && (
              <p className="text-xs text-indigo-100/90 mt-0.5">
                학생·수업을 등록하면 오늘 일정이 표시됩니다.
              </p>
            )}
          </div>
          {!isEmpty && (
            <p className="text-[11px] text-indigo-200 font-medium shrink-0">
              미납 {formatCurrency(unpaidTotal)}
            </p>
          )}
        </div>
        <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5">
          {kpiChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setActiveTab(chip.tab)}
              className={`shrink-0 inline-flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-lg border text-xs font-bold ${chip.tone}`}
            >
              <span className="opacity-70">{chip.label}</span>
              <span className="tabular-nums text-sm">{chip.value}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-indigo-600" />
              오늘 일정
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 min-h-[44px] px-1"
            >
              전체 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayClasses.length === 0 ? (
            <div className="py-6 text-center space-y-1.5">
              <CalendarCheck className="w-7 h-7 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">오늘 예정된 수업이 없습니다</p>
              <button
                type="button"
                onClick={() => setActiveTab('classes')}
                className="text-xs font-bold text-indigo-600 min-h-[44px]"
              >
                반/수업 관리로 이동
              </button>
            </div>
          ) : (
            <ol className="space-y-1.5">
              {todayClasses.map((cls) => {
                const enrolled = students.filter(
                  (s) => s.status === 'active' && s.classIds?.includes(cls.id)
                ).length;
                const isNow =
                  !!cls.startTime &&
                  !!cls.endTime &&
                  cls.startTime <= nowHm &&
                  nowHm < cls.endTime;
                const isNext =
                  !isNow &&
                  !!cls.startTime &&
                  cls.startTime > nowHm &&
                  todayClasses.find((c) => c.startTime && c.startTime > nowHm)?.id === cls.id;

                return (
                  <li key={cls.id}>
                    <button
                      type="button"
                      onClick={() => setActiveTab('lessons')}
                      className={`w-full text-left flex items-center gap-2.5 px-2.5 py-2 rounded-xl border min-h-[52px] transition-colors ${
                        isNow
                          ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-100'
                          : isNext
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                      }`}
                    >
                      <div className="w-12 shrink-0 text-center">
                        <p className="font-mono text-sm font-black text-indigo-700">
                          {cls.startTime}
                        </p>
                        <p className="text-[10px] text-slate-400">~{cls.endTime}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{cls.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {cls.teacherName} · {cls.room} · {enrolled}/{cls.capacity}명
                        </p>
                      </div>
                      {(isNow || isNext) && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            isNow ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isNow ? '진행' : '다음'}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <Inbox className="w-4 h-4 text-indigo-600" />
                상담 예약
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('consultations')}
                className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] px-1"
              >
                관리
              </button>
            </div>
            {pendingReservations.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">대기 예약 없음</p>
            ) : (
              <ul className="space-y-1.5">
                {pendingReservations.slice(0, 4).map((row) => (
                  <li
                    key={row.id}
                    className="px-2.5 py-2 rounded-lg bg-amber-50/80 border border-amber-100"
                  >
                    <p className="text-sm font-bold text-slate-900">{row.applicant_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatReservationTime(row.schedule_starts_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                미납
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('unpaid')}
                className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] px-1"
              >
                전체
              </button>
            </div>
            {recentUnpaid.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">미납 없음</p>
            ) : (
              <ul className="space-y-1.5">
                {recentUnpaid.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-rose-50/70 border border-rose-100 min-h-[44px]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{inv.studentName}</p>
                      <p className="text-[11px] text-slate-500">예정 {inv.dueDate.slice(5)}</p>
                    </div>
                    <p className="text-sm font-bold text-rose-700 shrink-0 tabular-nums">
                      {formatCurrency(inv.unpaidAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[
          { tab: 'lessons' as const, label: '오늘 레슨', icon: Piano, primary: true },
          { tab: 'attendance' as const, label: '출결', icon: CheckSquare, primary: false },
          { tab: 'students' as const, label: '학생', icon: UserPlus, primary: false },
        ].map(({ tab, label, icon: Icon, primary }) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-sm font-bold flex items-center justify-center gap-1.5 ${
              primary
                ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </section>

      <section className="flex items-center justify-between gap-3 px-0.5">
        <p className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
          <Users className="w-3.5 h-3.5" />
          재원 {stats.activeStudents}명
          {pendingReservationCount > 0 && (
            <span className="text-violet-600"> · 상담대기 {pendingReservationCount}</span>
          )}
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('consultations')}
          className="text-[11px] font-bold text-indigo-600 hover:underline min-h-[44px] inline-flex items-center gap-1"
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          상담
        </button>
      </section>
    </div>
  );
};
