import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import { formatKoreanDate } from '@/utils/formatters';
import {
  Users,
  CalendarCheck,
  CheckSquare,
  Clock,
  Sparkles,
  Piano,
  ChevronRight,
} from 'lucide-react';

/** 강사(staff) 전용 축소 대시보드 */
export const StaffDashboardView: React.FC = () => {
  const { setActiveTab, setSelectedStudentId, currentUser } = useApp();
  const { scopeStudents, scopeClasses, scopeMakeupItems, scopeLessons } = useStaffScope();

  const allStudents = StorageService.getStudents();
  const students = useMemo(() => scopeStudents(allStudents), [allStudents, scopeStudents]);
  const classes = useMemo(
    () => scopeClasses(StorageService.getClasses()),
    [scopeClasses]
  );
  const makeups = useMemo(
    () => scopeMakeupItems(StorageService.getMakeupItems(), allStudents),
    [allStudents, scopeMakeupItems]
  );
  const recentLessons = useMemo(
    () =>
      scopeLessons(StorageService.getLessonRecords())
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [scopeLessons]
  );

  const activeStudents = students.filter((s) => s.status === 'active');
  const pendingMakeups = makeups.filter((m) => m.status === 'pending').length;
  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date().getDay();
  const dayMap: Record<number, string> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
  const todayKorean = dayMap[dayIndex] || '월';
  const todayClasses = classes.filter((c) => c.daysOfWeek.includes(todayKorean as any));

  return (
    <div className="space-y-4 pb-4">
      <div className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 rounded-2xl px-4 py-3 text-white">
        <p className="text-indigo-200 text-[11px] font-semibold">강사 홈</p>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-lg font-bold tracking-tight">{currentUser.name} 선생님</h2>
          <p className="text-[11px] text-indigo-200">
            {formatKoreanDate(today)} · 수업 {todayClasses.length}
          </p>
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto">
          {[
            { label: '원생', value: activeStudents.length, tab: 'students' as const },
            { label: '오늘', value: todayClasses.length, tab: 'lessons' as const },
            { label: '미보강', value: pendingMakeups, tab: 'makeups' as const },
            { label: '최근', value: recentLessons.length, tab: 'lessons' as const },
          ].map(({ label, value, tab }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="shrink-0 inline-flex items-center gap-1.5 min-h-[36px] px-2.5 rounded-lg bg-white/10 border border-white/15 text-xs font-bold"
            >
              <span className="text-indigo-200">{label}</span>
              <span className="tabular-nums text-sm">{value}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              오늘 수업 ({todayKorean})
            </h3>
            <button
              type="button"
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] px-1"
            >
              시간표
            </button>
          </div>
          {todayClasses.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">오늘 예정된 수업이 없습니다</p>
          ) : (
            <div className="space-y-1.5">
              {todayClasses.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setActiveTab('lessons')}
                  className="w-full text-left px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-sm hover:border-indigo-200 hover:bg-indigo-50/40 min-h-[44px]"
                >
                  <p className="font-bold text-slate-900">{cls.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {cls.startTime}–{cls.endTime} · {cls.room}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-indigo-600" />
              담당 원생
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(null);
                setActiveTab('students');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] px-1"
            >
              전체
            </button>
          </div>
          {activeStudents.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">담당 원생이 없습니다</p>
          ) : (
            <div className="space-y-1.5">
              {activeStudents.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setActiveTab('students');
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-indigo-50/50 border border-indigo-100 text-sm hover:bg-indigo-50 min-h-[44px]"
                >
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="text-xs text-indigo-600">{s.level}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { tab: 'lessons' as const, label: '레슨', icon: Piano, primary: true },
          { tab: 'attendance' as const, label: '출결', icon: CheckSquare, primary: false },
          { tab: 'makeups' as const, label: '보강', icon: Sparkles, primary: false },
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
            <ChevronRight className={`w-3.5 h-3.5 ${primary ? 'text-white/70' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
    </div>
  );
};
