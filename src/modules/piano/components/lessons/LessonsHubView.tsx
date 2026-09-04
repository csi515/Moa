import { useState, type FC } from 'react';
import { SegmentedControl } from '@/shared/components';
import { TodayLessonView } from './TodayLessonView';
import { LessonRecordsView } from './LessonRecordsView';

type LessonSegment = 'today' | 'history';

/** 레슨 허브 — 보기 전환만 담당 (기능 로직 없음) */
export const LessonsHubView: FC = () => {
  const [segment, setSegment] = useState<LessonSegment>('today');

  return (
    <div className="space-y-4 pb-4">
      <div className="sticky top-0 z-10 -mx-1 px-1 py-1 bg-slate-50/90 backdrop-blur-sm">
        <SegmentedControl
          value={segment}
          options={[
            { value: 'today', label: '오늘 레슨' },
            { value: 'history', label: '전체 기록' },
          ]}
          onChange={setSegment}
          aria-label="레슨 보기 전환"
          fullWidth
          className="w-full shadow-xs"
        />
      </div>
      {segment === 'today' ? <TodayLessonView compactHeader /> : <LessonRecordsView />}
    </div>
  );
};
