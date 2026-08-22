import React from 'react';
import { TuitionInvoice, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { X } from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

interface TuitionPaymentModalProps {
  invoice: TuitionInvoice;
  payAmount: number;
  onPayAmountChange: (amount: number) => void;
  payMethod: PaymentMethod;
  onPayMethodChange: (method: PaymentMethod) => void;
  payMemo: string;
  onPayMemoChange: (memo: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const TuitionPaymentModal: React.FC<TuitionPaymentModalProps> = ({
  invoice,
  payAmount,
  onPayAmountChange,
  payMethod,
  onPayMethodChange,
  payMemo,
  onPayMemoChange,
  onSubmit,
  onClose
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">수강료 수납 처리</h3>
          <p className="text-xs text-slate-500">{invoice.studentName} ({invoice.yearMonth}월)</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            납부 금액 (₩) <span className="text-rose-500">*</span>
          </label>
          <CurrencyInput
            value={payAmount}
            onChange={onPayAmountChange}
            max={invoice.unpaidAmount}
            showQuickButtons
            autoFocus
          />
          <p className="text-[11px] text-slate-500 mt-1">
            남은 미납금: {formatCurrency(invoice.unpaidAmount)}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">결제 방법</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'card', label: '신용/체크카드' },
              { id: 'transfer', label: '계좌이체' },
              { id: 'cash', label: '현금' }
            ].map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => onPayMethodChange(m.id as PaymentMethod)}
                className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                  payMethod === m.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">수납 메모</label>
          <input
            type="text"
            placeholder="예: 학부모 방문 카드 결제 완료"
            value={payMemo}
            onChange={(e) => onPayMemoChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
          >
            수납 완료 저장
          </button>
        </div>
      </form>
    </div>
  </div>
);
