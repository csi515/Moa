import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { CalendarDays, Clock, Phone, Printer, QrCode, User } from 'lucide-react';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { getPublicBookingUrl } from '@/core/organizations/publicCode';

interface Props {
  publicCode: string | null | undefined;
  enabled: boolean;
}

/** QR 인쇄용 카드 (업체 코드 기반) */
export const ConsultationQrPrintCard: React.FC<Props> = ({ publicCode, enabled }) => {
  const { currentOrganization } = useOrganization();
  const [qrDataUrl, setQrDataUrl] = useState('');

  const bookingUrl = useMemo(
    () => (publicCode ? getPublicBookingUrl(publicCode) : ''),
    [publicCode]
  );

  useEffect(() => {
    if (!bookingUrl) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(bookingUrl, { width: 240, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [bookingUrl]);

  const handlePrint = () => {
    window.print();
  };

  if (!publicCode) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        업체 코드가 없어 QR 링크를 만들 수 없습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        id="consultation-qr-print-area"
        className="rounded-2xl border border-slate-200 bg-white p-6 print:border-0 print:shadow-none"
      >
        <div className="text-center space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">상담 예약</p>
          <h3 className="text-xl font-black text-slate-900">
            {currentOrganization?.name ?? '우리 학원'}
          </h3>
          <p className="text-sm text-slate-600">QR 코드를 스캔하고 상담 시간을 예약해 주세요</p>
          <p className="text-xs font-mono tracking-wider text-slate-500">코드: {publicCode}</p>

          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="상담 예약 QR 코드"
              className="mx-auto w-48 h-48 rounded-xl border border-slate-100"
            />
          ) : (
            <div className="mx-auto w-48 h-48 rounded-xl bg-slate-100 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-slate-400" />
            </div>
          )}

          <p className="text-xs text-slate-500 break-all">{bookingUrl}</p>
          {!enabled && (
            <p className="text-xs text-amber-700 font-medium">
              현재 상담 예약 접수가 꺼져 있습니다. 설정에서 활성화하면 고객이 신청할 수 있습니다.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 print:hidden"
      >
        <Printer className="w-4 h-4" />
        QR 포스터 인쇄
      </button>
    </div>
  );
};

/** 신청 카드 (관리자 목록용) */
export const ConsultationRequestCard: React.FC<{
  name: string;
  phone: string;
  content: string;
  preferredDate: string;
  preferredTime: string;
  statusLabel: string;
  statusClassName: string;
  adminMemo?: string;
  actions?: React.ReactNode;
}> = ({
  name,
  phone,
  content,
  preferredDate,
  preferredTime,
  statusLabel,
  statusClassName,
  adminMemo,
  actions,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          {name}
        </p>
        <a
          href={`tel:${phone}`}
          className="text-sm text-indigo-600 font-medium inline-flex items-center gap-1 mt-1 min-h-[44px]"
        >
          <Phone className="w-3.5 h-3.5" />
          {phone}
        </a>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClassName}`}>
        {statusLabel}
      </span>
    </div>

    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" />
        {preferredDate}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        {preferredTime}
      </span>
    </div>

    <p className="text-sm text-slate-700 whitespace-pre-wrap">{content}</p>

    {adminMemo && (
      <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">메모: {adminMemo}</p>
    )}

    {actions}
  </article>
);
