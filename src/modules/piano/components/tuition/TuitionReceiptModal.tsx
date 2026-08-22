import React from 'react';
import { TuitionInvoice, AcademySettings } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { Printer, X } from 'lucide-react';

interface TuitionReceiptModalProps {
  invoice: TuitionInvoice;
  settings: AcademySettings;
  onClose: () => void;
}

export const TuitionReceiptModal: React.FC<TuitionReceiptModalProps> = ({
  invoice,
  settings,
  onClose
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-6">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between no-print">
        <span className="font-bold text-xs text-slate-600">수강료 납부 영수증 미리보기</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            영수증 인쇄
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6 bg-white text-slate-900 border-4 border-double border-slate-300 m-4 rounded-2xl">
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
            <span className="font-bold text-slate-900">{invoice.yearMonth}월분 피아노 수강료</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">납 부 금 액</span>
            <span className="font-black text-indigo-700 text-sm">
              {formatCurrency(invoice.paidAmount)}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">결 제 방 식</span>
            <span className="font-bold text-slate-800">
              {invoice.paymentMethod === 'card' ? '신용카드' : invoice.paymentMethod === 'transfer' ? '계좌이체' : '현금'}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-500">수 납 일 자</span>
            <span className="font-mono text-slate-800">{invoice.paidAt || invoice.paidDate || invoice.dueDate}</span>
          </div>
        </div>

        <div className="pt-4 border-t text-center space-y-1">
          <p className="text-xs font-semibold text-slate-700">위 금액을 정히 영수함.</p>
          <p className="text-sm font-black text-slate-900 mt-2">
            {settings.name}
          </p>
          <p className="text-[11px] text-slate-500">
            대표자: {settings.directorName || settings.representative || '김원장'} | 연락처: {settings.phone}
          </p>
          <p className="text-[10px] text-slate-400">
            {settings.address}
          </p>
        </div>
      </div>
    </div>
  </div>
);
