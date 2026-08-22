import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import { ClassItem, DayOfWeek } from '@/types';
import {
  Clock,
  Printer,
  Filter,
  Users,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  X,
  ChevronRight,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];
const TIME_SLOTS = [
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00'
];

export const WeeklyTimetableView: React.FC = () => {
  const { setSelectedStudentId, setActiveTab, currentUser } = useApp();
  const { isScoped, staffId, scopeClasses, scopeStudents } = useStaffScope();

  const classes = useMemo(() => scopeClasses(StorageService.getClasses()), [scopeClasses]);
  const teachers = StorageService.getTeachers();
  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()),
    [scopeStudents]
  );

  // Get current Korean day of week
  const dayIndex = new Date().getDay(); // 0 is Sun, 1 is Mon...
  const currentDayMap: Record<number, DayOfWeek> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
  const initialDay: DayOfWeek = currentDayMap[dayIndex] || '월';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(initialDay);
  const [viewMode, setViewMode] = useState<'auto' | 'weekly' | 'daily'>('auto');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [roomFilter, setRoomFilter] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);

  useEffect(() => {
    if (isScoped && staffId) setTeacherFilter(staffId);
  }, [isScoped, staffId]);

  const rooms = Array.from(new Set(classes.map((c) => c.room)));

  const filteredClasses = classes.filter((cls) => {
    if (teacherFilter !== 'ALL' && cls.teacherId !== teacherFilter) return false;
    if (roomFilter !== 'ALL' && cls.room !== roomFilter) return false;
    return true;
  });

  const getClassesForSlot = (day: DayOfWeek, slotTime: string) => {
    const slotHour = parseInt(slotTime.split(':')[0], 10);
    return filteredClasses.filter((cls) => {
      if (!cls.daysOfWeek.includes(day)) return false;
      const classStartHour = parseInt(cls.startTime.split(':')[0], 10);
      return classStartHour === slotHour;
    });
  };

  const dayClasses = filteredClasses
    .filter((cls) => cls.daysOfWeek.includes(selectedDay))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-600" />
            수업 시간표
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            월요일 ~ 토요일 전체 클래스 타임테이블 및 일별 시간표
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold text-slate-600 no-print">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'daily' || viewMode === 'auto'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              요일별 (모바일 추천)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              주간 전체 그리드
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer no-print"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">인쇄</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>필터:</span>
          </div>

          {/* Teacher filter */}
          {!isScoped && (
          <select
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
          >
            <option value="ALL">전체 선생님</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          )}

          {/* Room filter */}
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
          >
            <option value="ALL">전체 강의실</option>
            {rooms.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          총 {filteredClasses.length}개 개설 강좌
        </span>
      </div>

      {/* Day Selector Tabs (Always visible on mobile, or in daily view) */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 no-scrollbar">
          {DAYS.map((day) => {
            const count = filteredClasses.filter((c) => c.daysOfWeek.includes(day)).length;
            const isToday = currentDayMap[dayIndex] === day;
            const isSelected = selectedDay === day;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-102'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>{day}요일</span>
                {isToday && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    오늘
                  </span>
                )}
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Daily Timeline View (Recommended for Mobile) */}
        {(viewMode === 'daily' || viewMode === 'auto') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                {selectedDay}요일 수업 일정 ({dayClasses.length}개 반)
              </h3>
              <span className="text-xs text-slate-400">카드를 누르면 상세/출결 확인</span>
            </div>

            {dayClasses.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-400 space-y-2">
                <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">{selectedDay}요일에 등록된 수업이 없습니다.</p>
                <p className="text-xs">상단 필터를 조정하거나 반 관리에서 수업을 개설하세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {dayClasses.map((cls) => {
                  const enrolled = students.filter((s) => s.status === 'active' && s.classIds?.includes(cls.id));
                  const isFull = enrolled.length >= cls.capacity;

                  return (
                    <div
                      key={cls.id}
                      onClick={() => setSelectedClass(cls)}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between space-y-3 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {cls.startTime} ~ {cls.endTime}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                              {cls.room}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {cls.name}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            담당: <strong>{cls.teacherName}</strong>
                          </p>
                        </div>

                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 mt-1 shadow-2xs"
                          style={{ backgroundColor: cls.color || '#4f46e5' }}
                        />
                      </div>

                      {/* Enrolled Students Quick Badges */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-slate-600 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>정원 {enrolled.length}/{cls.capacity}명</span>
                          {isFull && <span className="text-rose-600 font-bold text-[11px]">(마감)</span>}
                        </div>

                        <span className="text-[11px] font-bold text-indigo-600 flex items-center group-hover:translate-x-0.5 transition-transform">
                          상세보기 <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Timetable Grid (Desktop / Full Week View) */}
        {viewMode === 'weekly' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[760px]">
                {/* Table Header with Days */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-700">
                  <div className="py-3 px-2 border-r border-slate-200 text-slate-400">시간</div>
                  {DAYS.map((day) => (
                    <div key={day} className="py-3 px-2 border-r border-slate-200 last:border-r-0">
                      <span className={day === '토' ? 'text-indigo-600 font-extrabold' : ''}>
                        {day}요일
                      </span>
                    </div>
                  ))}
                </div>

                {/* Time Rows */}
                <div className="divide-y divide-slate-200">
                  {TIME_SLOTS.map((slot) => (
                    <div key={slot} className="grid grid-cols-7 min-h-[90px]">
                      {/* Time label */}
                      <div className="p-2 border-r border-slate-200 bg-slate-50/40 text-center flex flex-col justify-start items-center">
                        <span className="font-mono text-xs font-bold text-slate-600">{slot}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">50분</span>
                      </div>

                      {/* Day cells */}
                      {DAYS.map((day) => {
                        const slotClasses = getClassesForSlot(day, slot);

                        return (
                          <div
                            key={day}
                            className="p-1.5 border-r border-slate-200 last:border-r-0 hover:bg-indigo-50/20 transition-colors space-y-1.5"
                          >
                            {slotClasses.map((cls) => {
                              const enrolled = students.filter((s) => s.status === 'active' && s.classIds?.includes(cls.id));
                              return (
                                <div
                                  key={cls.id}
                                  onClick={() => setSelectedClass(cls)}
                                  className="p-2 rounded-xl text-white text-xs cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all flex flex-col justify-between"
                                  style={{ backgroundColor: cls.color || '#4f46e5' }}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-[11px] truncate">{cls.name}</span>
                                    <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded">
                                      {cls.room}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-white/90 mt-1">
                                    <span>{cls.teacherName}</span>
                                    <span className="font-bold">{enrolled.length}/{cls.capacity}명</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class Enrolled Details Modal */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div
              className="p-5 text-white flex items-center justify-between"
              style={{ backgroundColor: selectedClass.color || '#4f46e5' }}
            >
              <div>
                <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md font-semibold">
                  {selectedClass.room}
                </span>
                <h3 className="font-bold text-lg mt-1">{selectedClass.name}</h3>
                <p className="text-xs text-white/80">
                  {selectedClass.daysOfWeek.join(', ')} | {selectedClass.startTime} ~ {selectedClass.endTime}
                </p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                <span>담당: <strong>{selectedClass.teacherName}</strong></span>
                <span>정원: <strong>{selectedClass.capacity}명</strong></span>
                <span>교재: {selectedClass.textbook || '-'}</span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  수강 중인 원생 목록
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {students
                    .filter((s) => s.status === 'active' && s.classIds?.includes(selectedClass.id))
                    .map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setActiveTab('students');
                        }}
                        className="p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50 flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{st.name}</span>
                          <span className="text-slate-500">
                            {st.school} {st.grade}
                          </span>
                        </div>
                        <span className="text-indigo-600 font-semibold flex items-center">
                          상세보기 <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedClass(null);
                    setActiveTab('attendance');
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  이 반 출결 체크하러 가기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
