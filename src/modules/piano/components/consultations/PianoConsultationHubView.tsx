import { useState, type FC } from 'react';
import { CalendarPlus, Clock, MessageSquareText, QrCode } from 'lucide-react';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { ConsultationRecordsView } from '@/core/academy';
import { ReservationInboxView } from '@/core/schedules/components/ReservationInboxView';
import { AvailabilitySettingsView } from '@/core/schedules/components/AvailabilitySettingsView';
import { ConsultationQrModal } from '@/core/schedules/components/ConsultationQrModal';
import { CreateConsultationScheduleModal } from '@/core/schedules/components/CreateConsultationScheduleModal';
import { CustomerJoinRequestsPanel } from '@/core/customer/CustomerJoinRequestsPanel';
import { ConsultationTodaySection } from './ConsultationTodaySection';
import { usePianoConsultationHub } from './usePianoConsultationHub';

/**
 * 피아노 상담 허브
 * Core 예약/가능시간/QR + 상담 기록
 */
export const PianoConsultationHubView: FC = () => {
  const [showQr, setShowQr] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const {
    currentOrganization,
    isScoped,
    canJoin,
    canAvailability,
    segment,
    setSegment,
    options,
    todayRows,
    loadingToday,
    todayError,
    pendingInquiryCount,
    pendingToday,
    keepReservation,
    keepInquiry,
    loadToday,
  } = usePianoConsultationHub();

  const orgName = currentOrganization?.name || '사업장';
  const publicCode = currentOrganization?.public_code;

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<MessageSquareText className="w-6 h-6" />}
        title="상담"
        description={
          segment === 'home' && pendingToday > 0 ? `오늘 대기 ${pendingToday}건` : undefined
        }
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {!isScoped && (
              <>
                <button
                  type="button"
                  onClick={() => setShowCreateSchedule(true)}
                  className="min-h-[44px] px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <CalendarPlus className="w-4 h-4" />
                  상담 일정
                </button>
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50"
                >
                  <QrCode className="w-4 h-4" />
                  상담 QR
                </button>
              </>
            )}
            {canAvailability && (
              <button
                type="button"
                onClick={() => setSegment('availability')}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50"
              >
                <Clock className="w-4 h-4" />
                가능시간
              </button>
            )}
          </div>
        }
      />

      <SegmentedControl
        value={segment}
        options={options}
        onChange={setSegment}
        aria-label="상담 메뉴"
        fullWidth
        className="w-full"
      />

      {segment === 'home' && (
        <ConsultationTodaySection
          loading={loadingToday}
          error={todayError}
          rows={todayRows}
          isScoped={isScoped}
          pendingInquiryCount={pendingInquiryCount}
          onOpenReservations={() => setSegment('reservations')}
          onOpenInquiries={() => setSegment('inquiries')}
          onRetry={() => void loadToday()}
        />
      )}

      {segment === 'reservations' && (
        <ReservationInboxView
          embedded
          includeReservation={isScoped ? keepReservation : undefined}
          emptyHint={isScoped ? '담당 상담 예약이 없습니다.' : undefined}
        />
      )}
      {segment === 'joins' && canJoin && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 px-0.5">
            수강 가입 신청은 학생 메뉴의 「등록」에서도 처리할 수 있습니다.
          </p>
          <CustomerJoinRequestsPanel
            embedded
            requestType="membership"
            title="수강 가입 신청"
            description="성인 수강생이 보낸 가입 신청입니다. 승인하면 그 계정으로 이 학원 포털을 쓸 수 있습니다."
          />
        </div>
      )}
      {segment === 'inquiries' && (
        <CustomerJoinRequestsPanel
          embedded
          requestType="consultation"
          title="상담 문의"
          description={
            isScoped
              ? '담당 학생이거나 본인에게 온 상담 문의입니다.'
              : 'QR·공개 페이지에서 보낸 자유 양식 상담 문의입니다.'
          }
          includeRequest={isScoped ? keepInquiry : undefined}
          emptyHint={isScoped ? '담당 상담 문의가 없습니다.' : undefined}
        />
      )}
      {segment === 'records' && <ConsultationRecordsView embedded />}
      {segment === 'availability' && canAvailability && (
        <AvailabilitySettingsView
          embedded
          title="상담 가능 시간"
          defaultSlotTitle="상담"
          defaultSlotMinutes={30}
        />
      )}

      {showQr && (
        <ConsultationQrModal
          organizationName={orgName}
          publicCode={publicCode}
          onClose={() => setShowQr(false)}
        />
      )}
      {showCreateSchedule && (
        <CreateConsultationScheduleModal
          onClose={() => setShowCreateSchedule(false)}
          onCreated={() => {
            if (segment === 'home') void loadToday();
          }}
        />
      )}
    </div>
  );
};
