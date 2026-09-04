import type { FC } from 'react';
import type { NavTab } from '@/context/AppContext';
import { formatCurrency, formatKoreanDate } from '@/utils/formatters';
import { SummaryMetricCard } from '@/shared/components';
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CheckSquare,
  Clock,
  Inbox,
  MessageSquareText,
  UserPlus,
  Users,
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

/** 원장 홈 — 오늘 일정·출결·상담·미납·빠른 작업 */
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

  return (
    <div className="space-y-5 pb-12">
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl">
        <p className="text-xs text-indigo-200 font-semibold mb-1">
          {formatKoreanDate(new Date().toISOString())}
        </p>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          안녕하세요, {currentUserName}님
        </h2>
        <p className="text-sm text-indigo-100/90 mt-2 leading-relaxed">
          {isEmpty
            ? '학생을 등록하고 수업을 만들면 오늘 일정이 여기에 표시됩니다.'
            : `오늘 수업 ${stats.todayClassesCount} · 출석 ${stats.todayPresent} · 상담 대기 ${pendingReservationCount} · 미납 ${unpaidStudentCount}`}
        </p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <SummaryMetricCard
          label="오늘 수업"
          value={`${stats.todayClassesCount}`}
          subtitle="개 반"
          variant="indigo"
          onClick={() => setActiveTab('timetable')}
        />
        <SummaryMetricCard
          label="오늘 출석"
          value={`${stats.todayPresent}`}
          subtitle={`지각·조퇴 ${stats.todayLate}`}
          variant="emerald"
          onClick={() => setActiveTab('attendance')}
        />
        <SummaryMetricCard
          label="미출석·결석"
          value={`${stats.todayAbsent}`}
          subtitle={makeupPendingCount > 0 ? `미보강 ${makeupPendingCount}` : '보강 확인'}
          variant="amber"
          onClick={() => setActiveTab(makeupPendingCount > 0 ? 'makeups' : 'attendance')}
        />
        <SummaryMetricCard
          label="상담 예약"
          value={`${pendingReservationCount}`}
          subtitle="신청 대기"
          variant="purple"
          onClick={() => setActiveTab('consultations')}
        />
        <SummaryMetricCard
          label="미납"
          value={`${unpaidStudentCount}`}
          subtitle={formatCurrency(unpaidTotal)}
          variant="rose"
          onClick={() => setActiveTab('unpaid')}
          className="col-span-2 lg:col-span-1"
        />
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { tab: 'students' as const, label: '학생 등록', icon: UserPlus },
          { tab: 'timetable' as const, label: '일정', icon: Clock },
          { tab: 'attendance' as const, label: '출결 입력', icon: CheckSquare },
          { tab: 'consultations' as const, label: '상담 기록', icon: MessageSquareText },
        ].map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="min-h-[52px] px-3 py-3 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left flex items-center gap-2.5 transition-colors"
          >
            <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </span>
            <span className="text-sm font-bold text-slate-800">{label}</span>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
              <Clock className="w-4 h-4 text-indigo-600" />
              오늘 일정
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 min-h-[44px]"
            >
              전체 일정 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayClasses.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CalendarCheck className="w-8 h-8 text-slate-300 mx-auto" />
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
            <ol className="space-y-2">
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
                      onClick={() => setActiveTab('attendance')}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border min-h-[56px] transition-colors ${
                        isNow
                          ? 'bg-indigo-50 border-indigo-200'
                          : isNext
                            ? 'bg-emerald-50/70 border-emerald-200'
                            : 'bg-slate-50 border-slate-100 hover:border-indigo-200'
                      }`}
                    >
                      <div className="w-16 shrink-0">
                        <p className="font-mono text-sm font-bold text-indigo-700">
                          {cls.startTime}
                        </p>
                        <p className="text-[10px] text-slate-400">~ {cls.endTime}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">{cls.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {cls.teacherName} · {cls.room} · {enrolled}/{cls.capacity}명
                        </p>
                      </div>
                      {(isNow || isNext) && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                            isNow ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {isNow ? '진행 중' : '다음'}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <Inbox className="w-4 h-4 text-indigo-600" />
                상담 예약
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('consultations')}
                className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px]"
              >
                관리
              </button>
            </div>
            {pendingReservations.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">대기 중인 상담 예약이 없습니다</p>
            ) : (
              <ul className="space-y-2">
                {pendingReservations.slice(0, 5).map((row) => (
                  <li
                    key={row.id}
                    className="p-3 rounded-xl bg-amber-50/80 border border-amber-100"
                  >
                    <p className="text-sm font-bold text-slate-900">{row.applicant_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatReservationTime(row.schedule_starts_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm sm:text-base">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                미납
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('unpaid')}
                className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px]"
              >
                전체
              </button>
            </div>
            {recentUnpaid.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">미납 내역이 없습니다</p>
            ) : (
              <ul className="space-y-2">
                {recentUnpaid.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-rose-50/70 border border-rose-100"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{inv.studentName}</p>
                      <p className="text-xs text-slate-500">예정 {inv.dueDate.slice(5)}</p>
                    </div>
                    <p className="text-sm font-bold text-rose-700 shrink-0">
                      {formatCurrency(inv.unpaidAmount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          재원 학생 {stats.activeStudents}명
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px]"
        >
          학생 목록
        </button>
      </section>
    </div>
  );
};
