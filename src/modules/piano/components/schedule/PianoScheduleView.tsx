import { useMemo, type FC } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WeeklyTimetableView, AcademyCalendarView } from '@/core/academy';
import { SegmentedControl } from '@/shared/components';

type ScheduleSegment = 'classes' | 'events';

const SEGMENT_OPTIONS: { value: ScheduleSegment; label: string }[] = [
  { value: 'classes', label: '수업 시간표' },
  { value: 'events', label: '학원 캘린더' },
];

/** 피아노 일정 허브 — 레슨 허브와 같은 sticky 세그먼트 톤 */
export const PianoScheduleView: FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const segment: ScheduleSegment = useMemo(
    () => (activeTab === 'calendar' ? 'events' : 'classes'),
    [activeTab]
  );

  const handleSegmentChange = (next: ScheduleSegment) => {
    setActiveTab(next === 'events' ? 'calendar' : 'timetable');
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-slate-50/90 backdrop-blur-sm space-y-3">
        <div className="flex items-end justify-between gap-3 px-0.5">
          <div>
            <p className="text-[11px] font-semibold text-indigo-600">일정</p>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {segment === 'classes' ? (
                <Clock className="w-5 h-5 text-indigo-600" />
              ) : (
                <Calendar className="w-5 h-5 text-indigo-600" />
              )}
              {segment === 'classes' ? '수업 시간표' : '학원 캘린더'}
            </h2>
          </div>
        </div>
        <SegmentedControl
          value={segment}
          options={SEGMENT_OPTIONS}
          onChange={handleSegmentChange}
          aria-label="일정 보기 전환"
          fullWidth
          className="w-full shadow-xs"
        />
      </div>

      {segment === 'classes' ? <WeeklyTimetableView embedded /> : <AcademyCalendarView embedded />}
    </div>
  );
};
