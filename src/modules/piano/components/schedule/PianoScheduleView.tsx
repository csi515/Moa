import { useMemo, type FC } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { WeeklyTimetableView, AcademyCalendarView } from '@/core/academy';
import { PageHeader, SegmentedControl } from '@/shared/components';

type ScheduleSegment = 'classes' | 'events';

const SEGMENT_OPTIONS: { value: ScheduleSegment; label: string }[] = [
  { value: 'classes', label: '수업 시간표' },
  { value: 'events', label: '학원 캘린더' },
];

/**
 * 피아노 일정 허브
 * - 모바일 하단 '일정'과 사이드바 시간표/캘린더를 하나의 업무 흐름으로 연결
 * - Core bookable schedule/reservation UI는 포함하지 않음 (추후 상담 흐름에서 연결)
 */
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
      <PageHeader
        icon={segment === 'classes' ? <Clock className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
        title="일정"
        description={
          segment === 'classes'
            ? '수업 일정을 확인하고 출결로 바로 이동합니다.'
            : '휴강·행사 등 학원 일정을 관리합니다.'
        }
        actions={
          <SegmentedControl
            value={segment}
            options={SEGMENT_OPTIONS}
            onChange={handleSegmentChange}
            aria-label="일정 보기 전환"
            fullWidth
            className="w-full sm:w-auto min-w-[260px]"
          />
        }
      />

      {segment === 'classes' ? <WeeklyTimetableView embedded /> : <AcademyCalendarView embedded />}
    </div>
  );
};
