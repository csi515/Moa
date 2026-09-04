import { useState, type FC } from 'react';
import { MessageSquareText } from 'lucide-react';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { ConsultationRecordsView } from '@/core/academy';
import { ReservationInboxView } from '@/core/schedules/components/ReservationInboxView';
import { AvailabilitySettingsView } from '@/core/schedules/components/AvailabilitySettingsView';

type ConsultationSegment = 'reservations' | 'records' | 'availability';

const OPTIONS: { value: ConsultationSegment; label: string }[] = [
  { value: 'reservations', label: '예약 관리' },
  { value: 'records', label: '상담 기록' },
  { value: 'availability', label: '가능시간 설정' },
];

/**
 * 피아노 상담 허브
 * Core 예약/가능시간 인프라 + 피아노 상담 기록 UX
 */
export const PianoConsultationHubView: FC = () => {
  const [segment, setSegment] = useState<ConsultationSegment>('reservations');

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        icon={<MessageSquareText className="w-6 h-6" />}
        title="상담"
        description={
          segment === 'reservations'
            ? '학부모 상담 예약을 확인하고 확정·취소합니다.'
            : segment === 'records'
              ? '재원생·학부모 상담 일지를 남깁니다.'
              : '상담 가능 시간을 설정하고 예약 슬롯을 만듭니다.'
        }
        actions={
          <SegmentedControl
            value={segment}
            options={OPTIONS}
            onChange={setSegment}
            aria-label="상담 메뉴"
            fullWidth
            className="w-full sm:w-auto min-w-[280px]"
          />
        }
      />

      {segment === 'reservations' && <ReservationInboxView embedded />}
      {segment === 'records' && <ConsultationRecordsView embedded />}
      {segment === 'availability' && (
        <AvailabilitySettingsView
          embedded
          title="상담 가능 시간"
          description="학부모 상담을 받을 수 있는 반복 시간과 날짜 예외를 설정합니다."
          defaultSlotTitle="상담"
          defaultSlotMinutes={30}
        />
      )}
    </div>
  );
};
