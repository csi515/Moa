import { useMemo, type FC } from 'react';
import { Calendar, Clock, Piano, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WeeklyTimetableView, AcademyCalendarView } from '@/core/academy';
import { SegmentedControl } from '@/shared/components';
import { LessonsHubView } from '../lessons/LessonsHubView';
import { MakeupManagementView } from '../makeup/MakeupManagementView';

type ScheduleSegment = 'classes' | 'events' | 'lessons' | 'makeups';

const SEGMENT_OPTIONS: { value: ScheduleSegment; label: string }[] = [
  { value: 'classes', label: '시간표' },
  { value: 'events', label: '캘린더' },
  { value: 'lessons', label: '레슨' },
  { value: 'makeups', label: '보강' },
];

function tabToSegment(tab: string): ScheduleSegment {
  if (tab === 'calendar') return 'events';
  if (tab === 'lessons') return 'lessons';
  if (tab === 'makeups') return 'makeups';
  return 'classes';
}

/** 피아노 일정 허브 — 시간표·캘린더·레슨·보강 */
export const PianoScheduleView: FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const segment = useMemo(() => tabToSegment(activeTab), [activeTab]);

  const handleSegmentChange = (next: ScheduleSegment) => {
    if (next === 'events') setActiveTab('calendar');
    else if (next === 'lessons') setActiveTab('lessons');
    else if (next === 'makeups') setActiveTab('makeups');
    else setActiveTab('timetable');
  };

  const title =
    segment === 'classes'
      ? '수업 시간표'
      : segment === 'events'
        ? '학원 캘린더'
        : segment === 'lessons'
          ? '오늘 레슨'
          : '보강 수업';

  const TitleIcon =
    segment === 'classes'
      ? Clock
      : segment === 'events'
        ? Calendar
        : segment === 'lessons'
          ? Piano
          : Sparkles;

  return (
    <div className="space-y-4 pb-4">
      <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-slate-50/90 backdrop-blur-sm space-y-3">
        <div className="flex items-end justify-between gap-3 px-0.5">
          <div>
            <p className="text-[11px] font-semibold text-indigo-600">일정</p>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <TitleIcon className="w-5 h-5 text-indigo-600" />
              {title}
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

      {segment === 'classes' && <WeeklyTimetableView embedded />}
      {segment === 'events' && <AcademyCalendarView embedded />}
      {segment === 'lessons' && <LessonsHubView />}
      {segment === 'makeups' && <MakeupManagementView />}
    </div>
  );
};
