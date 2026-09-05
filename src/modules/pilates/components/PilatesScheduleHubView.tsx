import { useMemo, type FC } from 'react';
import { Calendar, Dumbbell } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, SegmentedControl } from '@/shared/components';

type ScheduleSegment = 'bookings' | 'services';

/** 필라테스 일정 허브 — 예약·수업 종류 */
export const PilatesScheduleHubView: FC<{
  bookingsView: FC;
  servicesView: FC;
}> = ({ bookingsView: BookingsView, servicesView: ServicesView }) => {
  const { activeTab, setActiveTab } = useApp();
  const segment: ScheduleSegment = useMemo(
    () => (activeTab === 'services' ? 'services' : 'bookings'),
    [activeTab]
  );

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={
          segment === 'bookings' ? (
            <Calendar className="w-5 h-5" />
          ) : (
            <Dumbbell className="w-5 h-5" />
          )
        }
        title="일정"
        description={segment === 'bookings' ? '예약 캘린더' : '수업 종류'}
        actions={
          <SegmentedControl
            value={segment}
            options={[
              { value: 'bookings', label: '예약' },
              { value: 'services', label: '수업 종류' },
            ]}
            onChange={(next) => setActiveTab(next)}
            aria-label="일정 메뉴"
            fullWidth
            className="w-full sm:w-auto min-w-[180px]"
          />
        }
      />
      {segment === 'bookings' ? <BookingsView /> : <ServicesView />}
    </div>
  );
};
