import { useState, type FC } from 'react';
import {
  ArrowLeft,
  CalendarPlus,
  Clock,
  MessageSquareText,
  QrCode,
  UserPlus,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { ConsultationRecordsView } from '@/core/academy';
import { ReservationInboxView } from '@/core/schedules/components/ReservationInboxView';
import { ConsultationQrModal } from '@/core/schedules/components/ConsultationQrModal';
import { CreateConsultationScheduleModal } from '@/core/schedules/components/CreateConsultationScheduleModal';
import { CustomerJoinRequestsPanel } from '@/core/customer/CustomerJoinRequestsPanel';
import { ConsultationTodaySection } from './ConsultationTodaySection';
import {
  isConsultationWorkSegment,
  usePianoConsultationHub,
  type ConsultationSegment,
} from './usePianoConsultationHub';

function workDescription(
  segment: ConsultationSegment,
  pendingInquiryCount: number,
  pendingToday: number
): string {
  if (segment === 'inquiries') {
    return pendingInquiryCount > 0
      ? `대기 문의 ${pendingInquiryCount}건`
      : 'QR·공개 페이지에서 온 상담 문의를 확인합니다';
  }
  if (segment === 'reservations') {
    return '상담 예약 요청을 확인하고 확정합니다';
  }
  if (segment === 'records') {
    return '상담 내용을 기록하고 이전 기록을 봅니다';
  }
  if (segment === 'home') {
    return pendingToday > 0
      ? `오늘 대기 예약 ${pendingToday}건`
      : '오늘 예정된 상담 일정을 봅니다';
  }
  if (segment === 'joins') {
    return '성인 학생 수강 가입 신청을 승인합니다';
  }
  return '상담 문의·예약·기록을 처리합니다';
}

/**
 * 피아노 상담 허브
 * 업무(문의·예약·기록·오늘). 가능시간은 설정(부가)으로 이동.
 */
export const PianoConsultationHubView: FC = () => {
  const { setActiveTab } = useApp();
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
  const inWork = isConsultationWorkSegment(segment);
  const showTools = !isScoped || canAvailability || canJoin;

  const backToWork = () => setSegment('inquiries');

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<MessageSquareText className="w-6 h-6" />}
        title="상담"
        description={workDescription(segment, pendingInquiryCount, pendingToday)}
      />

      {inWork && (
        <SegmentedControl
          value={segment}
          options={options}
          onChange={setSegment}
          aria-label="상담 업무"
          fullWidth
          className="w-full"
        />
      )}

      {!inWork && (
        <button
          type="button"
          onClick={backToWork}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 min-h-[44px] px-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          상담 업무로
        </button>
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

      {segment === 'reservations' && (
        <ReservationInboxView
          embedded
          includeReservation={isScoped ? keepReservation : undefined}
          emptyHint={isScoped ? '담당 상담 예약이 없습니다.' : undefined}
        />
      )}

      {segment === 'records' && <ConsultationRecordsView embedded />}

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

      {segment === 'joins' && canJoin && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 px-0.5">
            수강 가입 신청은 학생 메뉴의 「등록」에서도 처리할 수 있습니다.
          </p>
          <CustomerJoinRequestsPanel
            embedded
            requestType="membership"
            title="수강 가입 신청"
            description="성인 학생이 보낸 가입 신청입니다. 승인하면 그 계정으로 이 학원 포털을 쓸 수 있습니다."
          />
        </div>
      )}

      {showTools && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-0.5">
            상담 도구
          </p>
          <div className="flex flex-wrap gap-2">
            {!isScoped && (
              <>
                <button
                  type="button"
                  onClick={() => setShowQr(true)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-white"
                >
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  상담 QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateSchedule(true)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-white"
                >
                  <CalendarPlus className="w-4 h-4 text-indigo-600" />
                  상담 일정
                </button>
              </>
            )}
            {canAvailability && (
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-white"
              >
                <Clock className="w-4 h-4 text-indigo-600" />
                가능시간 설정
              </button>
            )}
            {canJoin && (
              <button
                type="button"
                onClick={() => setSegment('joins')}
                className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 ${
                  segment === 'joins'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                가입 신청
              </button>
            )}
          </div>
          {canAvailability && (
            <p className="text-[10px] text-slate-400 px-0.5">
              가능시간은 설정 → 부가 → 상담 가능시간에서도 열 수 있습니다.
            </p>
          )}
        </section>
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
