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
    <div className="space-y-5 pb-12">
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl">
        <p className="text-indigo-200 text-xs font-semibold mb-1">강사 홈</p>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          {currentUser.name} 선생님
        </h2>
        <p className="text-indigo-200/90 text-sm mt-1.5">
          {formatKoreanDate(today)} · 오늘 수업 {todayClasses.length}개
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('lessons')}
          className="mt-4 inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-indigo-800 text-sm font-bold shadow-sm hover:bg-indigo-50"
        >
          <Piano className="w-4 h-4" />
          오늘 레슨 시작
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            label: '담당 원생',
            value: activeStudents.length,
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50',
            tab: 'students' as const,
          },
          {
            label: '오늘 수업',
            value: todayClasses.length,
            icon: Clock,
            color: 'text-teal-600 bg-teal-50',
            tab: 'lessons' as const,
          },
          {
            label: '미보강',
            value: pendingMakeups,
            icon: Sparkles,
            color: 'text-amber-600 bg-amber-50',
            tab: 'makeups' as const,
          },
          {
            label: '최근 레슨',
            value: recentLessons.length,
            icon: Piano,
            color: 'text-purple-600 bg-purple-50',
            tab: 'lessons' as const,
          },
        ].map(({ label, value, icon: Icon, color, tab }) => (
          <button
            key={label}
            type="button"
            onClick={() => setActiveTab(tab)}
            className="bg-white rounded-2xl border border-slate-200 p-3.5 text-left hover:border-indigo-300 min-h-[88px]"
          >
            <span className={`inline-flex w-8 h-8 rounded-xl items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </span>
            <p className="text-2xl font-black text-slate-900 mt-2 tabular-nums">{value}</p>
            <p className="text-[11px] text-slate-500 font-semibold">{label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" />
              오늘 수업 ({todayKorean})
            </h3>
            <button
              onClick={() => setActiveTab('timetable')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              시간표
            </button>
          </div>
          {todayClasses.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">오늘 예정된 수업이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setActiveTab('lessons')}
                  className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm hover:border-indigo-200 hover:bg-indigo-50/40"
                >
                  <p className="font-bold text-slate-900">{cls.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cls.startTime}–{cls.endTime} · {cls.room}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              담당 원생
            </h3>
            <button
              onClick={() => {
                setSelectedStudentId(null);
                setActiveTab('students');
              }}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              전체 보기
            </button>
          </div>
          {activeStudents.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">담당 원생이 없습니다</p>
          ) : (
            <div className="space-y-2">
              {activeStudents.slice(0, 6).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentId(s.id);
                    setActiveTab('students');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-sm hover:bg-indigo-50"
                >
                  <span className="font-bold text-slate-900">{s.name}</span>
                  <span className="text-xs text-indigo-600">{s.level}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { tab: 'lessons' as const, label: '오늘 레슨', icon: Piano, primary: true },
          { tab: 'attendance' as const, label: '출결 체크', icon: CheckSquare, primary: false },
          { tab: 'makeups' as const, label: '보강 관리', icon: Sparkles, primary: false },
          { tab: 'students' as const, label: '원생 목록', icon: Users, primary: false },
        ].map(({ tab, label, icon: Icon, primary }) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`p-3.5 rounded-2xl border text-left flex items-center gap-2.5 min-h-[56px] ${
              primary
                ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-white border-slate-200 hover:border-indigo-300'
            }`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${primary ? 'text-white' : 'text-indigo-600'}`} />
            <span className={`font-bold text-sm ${primary ? 'text-white' : 'text-slate-800'}`}>
              {label}
            </span>
            <ChevronRight
              className={`w-4 h-4 ml-auto ${primary ? 'text-white/70' : 'text-slate-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
