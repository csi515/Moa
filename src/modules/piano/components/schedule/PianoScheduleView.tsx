import { useEffect, useMemo, type FC } from 'react';
import { Calendar, Clock, DoorOpen, Sparkles } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { getPlaceLabel } from '@/core/industry/industryUi';
import { useStaffGrants, useStaffScope } from '@/hooks';
import { AcademyCalendarView } from '@/core/academy';
import { SegmentedControl } from '@/shared/components';
import { MakeupManagementView } from '../makeup/MakeupManagementView';
import { PracticeRoomBookingView } from '../practiceRooms/PracticeRoomBookingView';
import { PianoLessonTimetableView } from './PianoLessonTimetableView';

type ScheduleSegment = 'classes' | 'events' | 'makeups' | 'rooms';

const BASE_SEGMENT_OPTIONS: { value: ScheduleSegment; label: string }[] = [
  { value: 'classes', label: '시간표' },
  { value: 'events', label: '캘린더' },
  { value: 'makeups', label: '보강' },
  { value: 'rooms', label: '연습실' },
];

function tabToSegment(tab: string): ScheduleSegment {
  if (tab === 'calendar') return 'events';
  if (tab === 'makeups') return 'makeups';
  if (tab === 'practice-rooms') return 'rooms';
  return 'classes';
}

/** 피아노 일정 허브 — 시간표·캘린더·보강·연습실 (레슨은 하단「오늘」) */
export const PianoScheduleView: FC = () => {
  const { activeTab, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const placeLabel = getPlaceLabel(industry);
  const { isScoped } = useStaffScope();
  const { allow } = useStaffGrants();
  const canRooms = !isScoped || allow('practiceRooms');

  const segmentOptions = useMemo(
    () =>
      (canRooms
        ? BASE_SEGMENT_OPTIONS
        : BASE_SEGMENT_OPTIONS.filter((option) => option.value !== 'rooms')
      ).map((option) =>
        option.value === 'events' ? { ...option, label: `${placeLabel} 캘린더` } : option
      ),
    [canRooms, placeLabel]
  );

  useEffect(() => {
    if (!canRooms && activeTab === 'practice-rooms') setActiveTab('timetable');
  }, [canRooms, activeTab, setActiveTab]);

  const segment = useMemo(() => {
    const next = tabToSegment(activeTab);
    if (!canRooms && next === 'rooms') return 'classes';
    return next;
  }, [activeTab, canRooms]);

  const handleSegmentChange = (next: ScheduleSegment) => {
    if (next === 'events') setActiveTab('calendar');
    else if (next === 'makeups') setActiveTab('makeups');
    else if (next === 'rooms') setActiveTab('practice-rooms');
    else setActiveTab('timetable');
  };

  const title =
    segment === 'classes'
      ? '수업 시간표'
      : segment === 'events'
        ? `${placeLabel} 캘린더`
        : segment === 'makeups'
          ? '보강 수업'
          : '연습실 예약';

  const TitleIcon =
    segment === 'classes'
      ? Clock
      : segment === 'events'
        ? Calendar
        : segment === 'makeups'
          ? Sparkles
          : DoorOpen;

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
          options={segmentOptions}
          onChange={handleSegmentChange}
          aria-label="일정 보기 전환"
          fullWidth
          className="w-full shadow-xs"
        />
      </div>

      {segment === 'classes' && <PianoLessonTimetableView />}
      {segment === 'events' && <AcademyCalendarView embedded />}
      {segment === 'makeups' && <MakeupManagementView />}
      {segment === 'rooms' && canRooms && <PracticeRoomBookingView />}
    </div>
  );
};
