import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, QrCode } from 'lucide-react';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { getPublicBookingUrl } from '@/core/organizations/publicCode';

interface Props {
  publicCode: string;
  enabled: boolean;
}

/** QR 인쇄용 카드 (업체 코드 기반) */
export const ConsultationQrPrintCard: React.FC<Props> = ({ publicCode, enabled }) => {
  const { currentOrganization } = useOrganization();
  const [qrDataUrl, setQrDataUrl] = useState('');

  const bookingUrl = useMemo(() => getPublicBookingUrl(publicCode), [publicCode]);

  useEffect(() => {
    QRCode.toDataURL(bookingUrl, { width: 240, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [bookingUrl]);

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
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 print:hidden"
      >
        <Printer className="w-4 h-4" />
        QR 포스터 인쇄
      </button>
    </div>
  );
};
