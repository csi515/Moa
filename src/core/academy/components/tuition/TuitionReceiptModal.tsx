import React from 'react';
import { TuitionInvoice, AcademySettings } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { formatPaymentMethodLabel } from '@/core/finance/paymentMethodLabels';
import { Modal } from '@/shared/components/ui/Modal';
import { Printer } from 'lucide-react';

interface TuitionReceiptModalProps {
  invoice: TuitionInvoice;
  settings: AcademySettings;
  onClose: () => void;
}

export const TuitionReceiptModal: React.FC<TuitionReceiptModalProps> = ({
  invoice,
  settings,
  onClose,
}) => (
  <Modal
    isOpen
    onClose={onClose}
    title="수강료 납부 영수증"
    maxWidth="lg"
    headerActions={
      <button
        type="button"
        onClick={() => window.print()}
        className="px-3 py-2 min-h-[44px] bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 no-print"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">인쇄</span>
      </button>
    }
  >
    <div className="p-6 sm:p-8 space-y-6 bg-white text-slate-900 border-4 border-double border-slate-300 m-4 rounded-2xl">
      <div className="text-center border-b pb-4">
        <h3 className="text-2xl font-black tracking-widest text-slate-900">
          수 강 료 납 부 영 수 증
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          영수증 번호: {invoice.receiptNumber || 'REC-202508-01'}
        </p>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">원 생 성 명</span>
          <span className="font-bold text-slate-900">{invoice.studentName}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">수 납 년 월</span>
          <span className="font-bold text-slate-900">{invoice.yearMonth}월분 수강료</span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">납 부 금 액</span>
          <span className="font-black text-indigo-700 text-sm">
            {formatCurrency(invoice.paidAmount)}
          </span>
        </div>
        {((invoice.textbookFee || 0) > 0 || (invoice.extraFee || 0) > 0) && (
          <div className="py-2 px-2 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
            <p className="text-[10px] font-bold text-slate-500">청구 내역</p>
            <div className="flex justify-between">
              <span className="text-slate-500">월회비</span>
              <span className="font-semibold">
                {formatCurrency(invoice.baseTuition ?? invoice.baseFee ?? 0)}
              </span>
            </div>
            {(invoice.textbookFee || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">교재비</span>
                <span className="font-semibold">{formatCurrency(invoice.textbookFee || 0)}</span>
              </div>
            )}
            {(invoice.extraFee || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">{invoice.extraFeeLabel || '기타'}</span>
                <span className="font-semibold">{formatCurrency(invoice.extraFee || 0)}</span>
              </div>
            )}
          </div>
        )}
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">결 제 방 식</span>
          <span className="font-bold text-slate-800">
            {formatPaymentMethodLabel(invoice.paymentMethod)}
          </span>
        </div>
        <div className="flex justify-between py-1 border-b border-slate-100">
          <span className="text-slate-500">수 납 일 자</span>
          <span className="font-mono text-slate-800">
            {invoice.paidAt || invoice.paidDate || invoice.dueDate}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t text-center space-y-1">
        <p className="text-xs font-semibold text-slate-700">위 금액을 정히 영수함.</p>
        <p className="text-sm font-black text-slate-900 mt-2">{settings.name}</p>
        <p className="text-[11px] text-slate-500">
          대표자: {settings.directorName || settings.representative || '-'} | 연락처:{' '}
          {settings.phone}
        </p>
        <p className="text-[10px] text-slate-400">{settings.address}</p>
      </div>
    </div>
  </Modal>
);
