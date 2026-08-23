import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import type { DayOfWeek } from '@/types';
import {
  BookOpen,
  Calendar,
  Clock,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';

const WEEKDAY_KO: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];

function durationBetween(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, (eh || 0) * 60 + (em || 0) - ((sh || 0) * 60 + (sm || 0)));
}

/** 일반 학원 대시보드 — 등록·퇴원·오늘 수업 */
export const AcademyDashboardView: React.FC = () => {
  const { setActiveTab, setSelectedStudentId } = useApp();
  const refreshKey = useStorageRefresh();

  const today = new Date().toISOString().slice(0, 10);
  const todayWeekday = WEEKDAY_KO[new Date().getDay()];

  const students = useMemo(() => StorageService.getStudents(), [refreshKey]);
  const classes = useMemo(() => StorageService.getClasses(), [refreshKey]);

  const active = students.filter((s) => s.status === 'active');
  const onLeave = students.filter((s) => s.status === 'leave');
  const withdrawn = students.filter((s) => s.status === 'withdrawn');
  const newThisMonth = students.filter((s) => s.joinDate?.startsWith(today.slice(0, 7))).length;

  const todayClasses = classes
    .filter((c) => c.daysOfWeek?.includes(todayWeekday as DayOfWeek))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const recentJoin = [...students]
    .filter((s) => s.status === 'active')
    .sort((a, b) => (b.joinDate || '').localeCompare(a.joinDate || ''))
    .slice(0, 5);

  const recentLeave = [...students]
    .filter((s) => (s.status === 'leave' || s.status === 'withdrawn') && s.leaveDate)
    .sort((a, b) => (b.leaveDate || '').localeCompare(a.leaveDate || ''))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<BookOpen className="w-6 h-6" />}
        iconClassName="text-indigo-600"
        title="학원 대시보드"
        description={`${formatKoreanDate(today)} · 원생 등록·퇴원과 오늘의 수업을 한눈에`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              원생 등록
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className="px-4 py-2.5 min-h-[44px] bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50"
            >
              <Clock className="w-4 h-4" />
              반/수업 관리
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryMetricCard label="재원" value={`${active.length}명`} variant="emerald" />
        <SummaryMetricCard label="휴원" value={`${onLeave.length}명`} variant="amber" />
        <SummaryMetricCard label="퇴원" value={`${withdrawn.length}명`} />
        <SummaryMetricCard
          label="이번 달 신규"
          value={`${newThisMonth}명`}
          variant="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              오늘 수업 ({todayWeekday})
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] px-2"
            >
              시간표
            </button>
          </div>
          {todayClasses.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">오늘 예정된 수업이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((cls) => {
                const enrolled = active.filter((s) => s.classIds?.includes(cls.id)).length;
                const mins = durationBetween(cls.startTime, cls.endTime);
                return (
                  <div
                    key={cls.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{cls.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {cls.startTime}~{cls.endTime} · {mins}분 · {cls.targetLevel || cls.level || '과목'}
                        {cls.room ? ` · ${cls.room}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-700 shrink-0">
                      {enrolled}/{cls.capacity}명
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              최근 등록
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] px-2"
            >
              원생 관리
            </button>
          </div>
          {recentJoin.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">등록된 재원생이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {recentJoin.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setActiveTab('students');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-left hover:bg-emerald-50"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-slate-900 truncate">{s.name}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 shrink-0">{s.joinDate}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
          <UserMinus className="w-4 h-4 text-slate-500" />
          최근 휴원·퇴원
        </h3>
        {recentLeave.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">휴원/퇴원 기록이 없습니다</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentLeave.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSelectedStudentId(s.id);
                  setActiveTab('students');
                }}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-left hover:bg-slate-100"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{s.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {s.status === 'leave' ? '휴원' : '퇴원'} · {s.leaveDate}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
