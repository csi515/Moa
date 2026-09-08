import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import {
  CalendarPlus,
  Clock,
  Loader2,
  MessageSquareText,
  Phone,
  QrCode,
  User,
} from 'lucide-react';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { ConsultationRecordsView } from '@/core/academy';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { ReservationInboxView } from '@/core/schedules/components/ReservationInboxView';
import { AvailabilitySettingsView } from '@/core/schedules/components/AvailabilitySettingsView';
import { ConsultationQrModal } from '@/core/schedules/components/ConsultationQrModal';
import { CreateConsultationScheduleModal } from '@/core/schedules/components/CreateConsultationScheduleModal';
import { reservationService } from '@/core/schedules';
import { CustomerJoinRequestsPanel } from '@/core/customer/CustomerJoinRequestsPanel';
import { customerJoinService } from '@/core/customer/services/customerJoinService';
import { consumeOpenConsultationInquiries } from '@/core/customer/studentJoinInbox';
import type { ReservationDetail } from '@/types';

type ConsultationSegment =
  | 'home'
  | 'reservations'
  | 'joins'
  | 'inquiries'
  | 'records'
  | 'availability';

const OPTIONS: { value: ConsultationSegment; label: string }[] = [
  { value: 'home', label: '오늘' },
  { value: 'reservations', label: '예약' },
  { value: 'joins', label: '가입' },
  { value: 'inquiries', label: '문의' },
  { value: 'records', label: '기록' },
  { value: 'availability', label: '가능시간' },
];

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameLocalDay(iso: string, key: string): boolean {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}` === key;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusLabel(status: string): { label: string; className: string } {
  if (status === 'confirmed') {
    return { label: '확정', className: 'bg-emerald-50 text-emerald-700' };
  }
  if (status === 'cancelled') {
    return { label: '취소', className: 'bg-slate-100 text-slate-500' };
  }
  return { label: '대기', className: 'bg-amber-50 text-amber-700' };
}

/**
 * 피아노 상담 허브
 * Core 예약/가능시간/QR + 상담 기록
 */
export const PianoConsultationHubView: FC = () => {
  const { showToast } = useApp();
  const { currentOrganization } = useOrganization();
  const [segment, setSegment] = useState<ConsultationSegment>('home');
  const [showQr, setShowQr] = useState(false);
  const [showCreateSchedule, setShowCreateSchedule] = useState(false);
  const [todayRows, setTodayRows] = useState<ReservationDetail[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [pendingInquiryCount, setPendingInquiryCount] = useState(0);

  useEffect(() => {
    if (consumeOpenConsultationInquiries()) setSegment('inquiries');
  }, []);

  const loadToday = useCallback(async () => {
    if (!currentOrganization) return;
    setLoadingToday(true);
    try {
      const all = await reservationService.getOrganizationReservations(currentOrganization.id);
      const key = todayKey();
      setTodayRows(
        all
          .filter((r) => r.status !== 'cancelled' && isSameLocalDay(r.schedule_starts_at, key))
          .sort((a, b) => a.schedule_starts_at.localeCompare(b.schedule_starts_at))
      );
    } catch (err) {
      console.error(err);
      showToast('오늘 상담을 불러오지 못했습니다.', 'error');
    } finally {
      setLoadingToday(false);
    }
  }, [currentOrganization, showToast]);

  useEffect(() => {
    if (segment === 'home') void loadToday();
  }, [segment, loadToday]);

  useEffect(() => {
    if (!currentOrganization?.id) return;
    let cancelled = false;
    customerJoinService
      .getOrgJoinRequests(currentOrganization.id, 'pending', 'consultation')
      .then((rows) => {
        if (!cancelled) setPendingInquiryCount(rows.length);
      })
      .catch(() => {
        if (!cancelled) setPendingInquiryCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [currentOrganization?.id, segment]);

  const orgName = currentOrganization?.name || '학원';
  const publicCode = currentOrganization?.public_code;

  const pendingToday = useMemo(
    () => todayRows.filter((r) => r.status === 'requested').length,
    [todayRows]
  );

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<MessageSquareText className="w-6 h-6" />}
        title="상담"
        description={
          segment === 'home' && pendingToday > 0
            ? `오늘 대기 ${pendingToday}건`
            : undefined
        }
        actions={
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
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
            <button
              type="button"
              onClick={() => setSegment('availability')}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50"
            >
              <Clock className="w-4 h-4" />
              가능시간
            </button>
          </div>
        }
      />

      <SegmentedControl
        value={segment}
        options={OPTIONS}
        onChange={setSegment}
        aria-label="상담 메뉴"
        fullWidth
        className="w-full"
      />

      {segment === 'home' && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">오늘 상담</h3>
          {loadingToday ? (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
          ) : todayRows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-bold text-slate-700">오늘 예정된 상담이 없습니다</p>
              <p className="text-xs text-slate-500 mt-1">
                가능시간을 설정하거나 상담 일정을 추가하세요.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todayRows.map((row) => {
                const badge = statusLabel(row.status);
                return (
                  <li
                    key={row.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatTime(row.schedule_starts_at)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="text-sm font-bold text-slate-800 truncate flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {row.applicant_name}
                      </p>
                      {row.applicant_phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {row.applicant_phone}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSegment('reservations')}
                      className="text-xs font-bold text-indigo-600 min-h-[36px] self-start sm:self-center"
                    >
                      예약에서 보기
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {pendingInquiryCount > 0 && (
            <button
              type="button"
              onClick={() => setSegment('inquiries')}
              className="w-full min-h-[44px] rounded-xl border border-violet-200 bg-violet-50 text-sm font-bold text-violet-800"
            >
              상담 문의 {pendingInquiryCount}건
            </button>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setSegment('reservations')}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              전체 상담 신청 보기
            </button>
          </div>
        </section>
      )}

      {segment === 'reservations' && <ReservationInboxView embedded />}
      {segment === 'joins' && (
        <CustomerJoinRequestsPanel
          embedded
          requestType="membership"
          title="수강 가입 신청"
          description="성인 수강생이 보낸 가입 신청입니다. 승인하면 그 계정으로 이 학원 포털을 쓸 수 있습니다."
        />
      )}
      {segment === 'inquiries' && (
        <CustomerJoinRequestsPanel
          embedded
          requestType="consultation"
          title="상담 문의"
          description="QR·공개 페이지에서 보낸 자유 양식 상담 문의입니다."
        />
      )}
      {segment === 'records' && <ConsultationRecordsView embedded />}
      {segment === 'availability' && (
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
