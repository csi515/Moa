import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { AcademyEvent } from '../../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Trophy,
  Sparkles,
  Music,
  Clock,
  Cake,
  X,
  Save
} from 'lucide-react';

export const AcademyCalendarView: React.FC = () => {
  const { showToast, openConfirmDialog } = useApp();

  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = August
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [events, setEvents] = useState<AcademyEvent[]>(() => {
    const saved = localStorage.getItem('piano_app_events');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'ev-1',
            title: '제12회 쇼팽 피아노 전국 콩쿠르 예선',
            startDate: '2025-08-23',
            type: 'competition',
            description: '초등부 5명 출전 (성남아트센터)',
            color: '#ef4444'
          },
          {
            id: 'ev-2',
            title: '여름방학 피아노 집중 특강 & 이론 골든벨',
            startDate: '2025-08-14',
            endDate: '2025-08-16',
            type: 'special_lesson',
            description: '음악 이론 및 청음 마스터 클래스',
            color: '#8b5cf6'
          },
          {
            id: 'ev-3',
            title: '전체 그랜드/업라이트 피아노 정기 조율',
            startDate: '2025-08-10',
            type: 'tuning',
            description: '서울조율사협회 마이스터 방문 조율',
            color: '#06b6d4'
          },
          {
            id: 'ev-4',
            title: '2025 가을 정기 연주회 (예술의전당 인근 홀)',
            startDate: '2025-10-25',
            type: 'concert',
            description: '전 원생 피아노 솔로 및 듀엣 연주회',
            color: '#4f46e5'
          }
        ];
  });

  const students = StorageService.getStudents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: '2025-08-20',
    type: 'concert' as AcademyEvent['type'],
    description: '',
    color: '#4f46e5'
  });

  const saveEvents = (updated: AcademyEvent[]) => {
    setEvents(updated);
    localStorage.setItem('piano_app_events', JSON.stringify(updated));
  };

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Days calculation
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 is Sunday

  const currentYearMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const monthEvents = useMemo(() => {
    return events.filter((e) => e.startDate.startsWith(currentYearMonthStr));
  }, [events, currentYearMonthStr]);

  // Student birthdays in this month
  const birthdayStudents = useMemo(() => {
    return students.filter((s) => {
      if (!s.birthDate) return false;
      const m = parseInt(s.birthDate.split('-')[1], 10);
      return m === currentMonth;
    });
  }, [students, currentMonth]);

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;

    const item: AcademyEvent = {
      id: `ev-${Date.now()}`,
      title: newEvent.title.trim(),
      startDate: newEvent.startDate,
      type: newEvent.type,
      description: newEvent.description.trim(),
      color: newEvent.color
    };

    saveEvents([...events, item]);
    showToast(`'${item.title}' 일정이 등록되었습니다.`, 'success');
    setIsModalOpen(false);
  };

  const handleDeleteEvent = (id: string) => {
    saveEvents(events.filter((e) => e.id !== id));
    showToast('일정이 삭제되었습니다.', 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-indigo-600" />
            학원 일정 및 캘린더
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            정기 연주회, 콩쿠르 출전, 방학/휴원, 조율 일정, 원생 생일
          </p>
        </div>

        <button
          onClick={() => {
            setNewEvent({
              title: '',
              startDate: `${currentYearMonthStr}-15`,
              type: 'concert',
              description: '',
              color: '#4f46e5'
            });
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          학원 일정 등록
        </button>
      </div>

      {/* Calendar Navigation & Month Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-slate-900">
          {currentYear}년 {currentMonth}월
        </h3>

        <button
          onClick={handleNextMonth}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Day of Week Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold py-3">
          <span className="text-rose-500">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-indigo-600">토</span>
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 text-xs">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] p-2 bg-slate-50/40" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${currentYearMonthStr}-${String(dayNum).padStart(2, '0')}`;
            const dayEvents = events.filter((e) => e.startDate === dateStr);
            const dayBdays = birthdayStudents.filter((s) => {
              const bDay = parseInt(s.birthDate.split('-')[2], 10);
              return bDay === dayNum;
            });

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`min-h-[100px] p-2 hover:bg-indigo-50/30 transition-colors cursor-pointer space-y-1 ${
                  selectedDay === dayNum ? 'bg-indigo-50/50 ring-2 ring-indigo-600 ring-inset' : ''
                }`}
              >
                <span className="font-bold text-slate-700">{dayNum}</span>

                {/* Event Pills */}
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-1 rounded-md text-[10px] font-bold text-white truncate shadow-2xs"
                    style={{ backgroundColor: ev.color || '#4f46e5' }}
                    title={ev.title}
                  >
                    {ev.title}
                  </div>
                ))}

                {/* Birthdays */}
                {dayBdays.map((s) => (
                  <div
                    key={s.id}
                    className="p-1 rounded-md text-[10px] font-bold bg-pink-100 text-pink-700 truncate flex items-center gap-1"
                  >
                    <Cake className="w-3 h-3 text-pink-500 shrink-0" />
                    <span>{s.name} 생일 🎂</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Month Events Detail List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          {currentMonth}월 전체 학원 행사 및 일정 ({monthEvents.length}건)
        </h3>

        <div className="space-y-3">
          {monthEvents.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">등록된 일정이 없습니다.</p>
          ) : (
            monthEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: ev.color || '#4f46e5' }}
                  />
                  <div>
                    <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {ev.startDate}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteEvent(ev.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Event Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">학원 일정 등록</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  행사 / 일정명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 2025 가을 정기 연주회"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">일정 일자</label>
                  <input
                    type="date"
                    required
                    value={newEvent.startDate}
                    onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">분류 유형</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="concert">정기 연주회</option>
                    <option value="competition">콩쿠르 출전</option>
                    <option value="special_lesson">특강/골든벨</option>
                    <option value="tuning">피아노 조율</option>
                    <option value="vacation">방학/휴원</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">상세 내용 및 장소</label>
                <textarea
                  rows={2}
                  placeholder="장소, 준비사항, 참가 대상 등..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">표시 색상</label>
                <div className="flex gap-2">
                  {['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewEvent({ ...newEvent, color: c })}
                      className={`w-7 h-7 rounded-xl border-2 transition-transform cursor-pointer ${
                        newEvent.color === c ? 'scale-110 border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
