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
    <div className="space-y-6 pb-12">
      <div className="bg-gradient-to-r from-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <p className="text-indigo-200 text-xs font-semibold mb-1">강사 대시보드</p>
        <h2 className="text-xl sm:text-2xl font-black">{currentUser.name} 선생님</h2>
        <p className="text-indigo-200 text-sm mt-1">{formatKoreanDate(today)} · 담당 학생 관리</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <Users className="w-5 h-5 text-indigo-600 mb-2" />
          <p className="text-2xl font-black text-slate-900">{activeStudents.length}</p>
          <p className="text-xs text-slate-500">담당 원생</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <Clock className="w-5 h-5 text-teal-600 mb-2" />
          <p className="text-2xl font-black text-slate-900">{todayClasses.length}</p>
          <p className="text-xs text-slate-500">오늘 수업</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <Sparkles className="w-5 h-5 text-amber-600 mb-2" />
          <p className="text-2xl font-black text-slate-900">{pendingMakeups}</p>
          <p className="text-xs text-slate-500">미보강</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <Piano className="w-5 h-5 text-purple-600 mb-2" />
          <p className="text-2xl font-black text-slate-900">{recentLessons.length}</p>
          <p className="text-xs text-slate-500">최근 레슨</p>
        </div>
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
                <div key={cls.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                  <p className="font-bold text-slate-900">{cls.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cls.startTime}–{cls.endTime} · {cls.room}
                  </p>
                </div>
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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { tab: 'attendance' as const, label: '출결 체크', icon: CheckSquare },
          { tab: 'lessons' as const, label: '레슨 기록', icon: Piano },
          { tab: 'makeups' as const, label: '보강 관리', icon: Sparkles },
          { tab: 'students' as const, label: '원생 목록', icon: Users },
        ].map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 text-left flex items-center gap-3"
          >
            <Icon className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="font-bold text-sm">{label}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
          </button>
        ))}
      </div>
    </div>
  );
};
