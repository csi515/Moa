import React from 'react';
import { TuitionInvoice } from '@/types';
import { formatCurrency, getInvoiceStatusBadge } from '@/utils/formatters';
import { Plus } from 'lucide-react';

interface StudentDetailTuitionTabProps {
  allInvoices: TuitionInvoice[];
  payInvoiceId: string | null;
  setPayInvoiceId: (id: string | null) => void;
  payAmount: number;
  setPayAmount: (amount: number) => void;
  payMethod: 'card' | 'transfer' | 'cash' | 'other';
  setPayMethod: (method: 'card' | 'transfer' | 'cash' | 'other') => void;
  payMemo: string;
  setPayMemo: (memo: string) => void;
  onCreateInvoice: () => void;
  onOpenPayModal: (inv: TuitionInvoice) => void;
  onProcessPayment: (e: React.FormEvent) => void;
}

export const StudentDetailTuitionTab: React.FC<StudentDetailTuitionTabProps> = ({
  allInvoices,
  payInvoiceId,
  setPayInvoiceId,
  payAmount,
  setPayAmount,
  payMethod,
  setPayMethod,
  payMemo,
  setPayMemo,
  onCreateInvoice,
  onOpenPayModal,
  onProcessPayment,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-sm font-bold text-slate-900">수강료 청구 및 납부 내역</h4>
        <p className="text-xs text-slate-500">월별 수납 청구서 및 결제 영수증</p>
      </div>
      <button
        onClick={onCreateInvoice}
        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" /> 청구서 추가 발행
      </button>
    </div>

    {payInvoiceId && (
      <form onSubmit={onProcessPayment} className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-3">
        <h5 className="text-xs font-bold text-emerald-900">수강료 수납 처리</h5>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">수납 금액 (₩)</label>
            <input
              type="number"
              step="1000"
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">결제 방법</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as 'card' | 'transfer' | 'cash' | 'other')}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium"
            >
              <option value="card">카드 결제</option>
              <option value="transfer">계좌 이체</option>
              <option value="cash">현금</option>
              <option value="other">기타</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">수납 메모</label>
            <input
              type="text"
              placeholder="영수증 메모..."
              value={payMemo}
              onChange={(e) => setPayMemo(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPayInvoiceId(null)}
            className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-1 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
          >
            수납 완료 저장
          </button>
        </div>
      </form>
    )}

    {allInvoices.length === 0 ? (
      <p className="text-xs text-slate-500 p-8 text-center bg-slate-50 rounded-2xl">청구된 수강료 내역이 없습니다.</p>
    ) : (
      <div className="space-y-3">
        {allInvoices.map((inv) => {
          const badge = getInvoiceStatusBadge(inv.status);
          return (
            <div
              key={inv.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{inv.yearMonth}월 청구서</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${badge.bg}`}>
                    {badge.label}
                  </span>
                  {inv.receiptNumber && (
                    <span className="text-[10px] font-mono text-slate-400">
                      #{inv.receiptNumber}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 mt-1">
                  납부기한: {inv.dueDate} | 총 청구: <strong>{formatCurrency(inv.totalAmount)}</strong>
                  {inv.paidAmount > 0 && ` (납부: ${formatCurrency(inv.paidAmount)})`}
                  {inv.unpaidAmount > 0 && ` [미납: ${formatCurrency(inv.unpaidAmount)}]`}
                </p>
                {inv.notes && <p className="text-slate-600 text-[11px] mt-1 italic">{inv.notes}</p>}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {inv.status !== 'paid' && (
                  <button
                    onClick={() => onOpenPayModal(inv)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    수납 결제
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
