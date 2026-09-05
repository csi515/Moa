import React, { useMemo, useState } from 'react';
import { Student, PaymentMethod } from '@/types';
import { StorageService } from '@/services/storage';
import { useApp } from '@/context/AppContext';
import { X, CreditCard, CheckSquare, Square, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface CombinedPaymentModalProps {
  student: Student;
  yearMonth?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const CombinedPaymentModal: React.FC<CombinedPaymentModalProps> = ({
  student,
  yearMonth,
  onSuccess,
  onClose,
}) => {
  const { showToast, triggerRefresh } = useApp();
  const effectiveYearMonth = yearMonth ?? new Date().toISOString().slice(0, 7);

  const billingSummary = StorageService.getStudentBillingSummary(student.id, yearMonth);
  const unpaidInvoices = (billingSummary.invoices || []).filter((i) => i.unpaidAmount > 0);
  const unpaidSales = (billingSummary.textbookSales || []).filter((s) => s.unpaidAmount > 0);

  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(
    unpaidInvoices.map((i) => i.id)
  );
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>(unpaidSales.map((s) => s.id));
  const [invoiceAmounts, setInvoiceAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(unpaidInvoices.map((i) => [i.id, i.unpaidAmount]))
  );
  const [saleAmounts, setSaleAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(unpaidSales.map((s) => [s.id, s.unpaidAmount]))
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');

  const selectedInvoiceTotal = useMemo(
    () =>
      unpaidInvoices
        .filter((i) => selectedInvoiceIds.includes(i.id))
        .reduce((sum, i) => sum + Math.min(invoiceAmounts[i.id] ?? 0, i.unpaidAmount), 0),
    [unpaidInvoices, selectedInvoiceIds, invoiceAmounts]
  );

  const selectedSaleTotal = useMemo(
    () =>
      unpaidSales
        .filter((s) => selectedSaleIds.includes(s.id))
        .reduce((sum, s) => sum + Math.min(saleAmounts[s.id] ?? 0, s.unpaidAmount), 0),
    [unpaidSales, selectedSaleIds, saleAmounts]
  );

  const grandSelectedTotal = selectedInvoiceTotal + selectedSaleTotal;

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSale = (id: string) => {
    setSelectedSaleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (grandSelectedTotal <= 0) {
      showToast('납부할 항목을 1개 이상 선택하고 금액을 입력해주세요.', 'warning');
      return;
    }

    try {
      const tuitionPayments = unpaidInvoices
        .filter((i) => selectedInvoiceIds.includes(i.id))
        .map((i) => ({
          invoiceId: i.id,
          amount: Math.min(Math.max(0, invoiceAmounts[i.id] ?? 0), i.unpaidAmount),
        }))
        .filter((i) => i.amount > 0);

      const textbookPayments = unpaidSales
        .filter((s) => selectedSaleIds.includes(s.id))
        .map((s) => ({
          saleId: s.id,
          amount: Math.min(Math.max(0, saleAmounts[s.id] ?? 0), s.unpaidAmount),
        }))
        .filter((s) => s.amount > 0);

      const res = StorageService.recordCombinedPayment({
        studentId: student.id,
        yearMonth: effectiveYearMonth,
        tuitionPayments,
        textbookPayments,
        paymentMethod,
        paymentDate,
        memo: memo.trim() || undefined,
      });

      showToast(
        `${student.name} 원생 통합 수납 ${formatCurrency(res.totalPaidAmount)} 처리 · 재무 수입에 반영됨`,
        'success'
      );
      triggerRefresh();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '통합 수납 처리 중 오류가 발생했습니다.';
      showToast(message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {student.name} · 통합 수납
              </h3>
              <p className="text-xs text-slate-500">
                항목별 납부 금액을 지정합니다. 자동 배분은 하지 않습니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg min-h-[44px] min-w-[44px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="space-y-2">
            <span className="font-bold text-slate-800">미납 수강료 ({unpaidInvoices.length})</span>
            {unpaidInvoices.length === 0 ? (
              <p className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center">미납 수강료 없음</p>
            ) : (
              unpaidInvoices.map((inv) => {
                const isChecked = selectedInvoiceIds.includes(inv.id);
                return (
                  <div
                    key={inv.id}
                    className={`p-3 rounded-xl border space-y-2 ${
                      isChecked ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleInvoice(inv.id)}
                      className="w-full flex items-center justify-between gap-2 text-left min-h-[44px]"
                    >
                      <span className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-bold text-slate-900">{inv.yearMonth} 수강료</span>
                      </span>
                      <span className="text-rose-600 font-black">
                        잔액 {formatCurrency(inv.unpaidAmount)}
                      </span>
                    </button>
                    {isChecked && (
                      <label className="block">
                        <span className="text-[11px] text-slate-500">이번 납부액</span>
                        <input
                          type="number"
                          min={0}
                          max={inv.unpaidAmount}
                          value={invoiceAmounts[inv.id] ?? 0}
                          onChange={(e) =>
                            setInvoiceAmounts((prev) => ({
                              ...prev,
                              [inv.id]: Math.min(
                                inv.unpaidAmount,
                                Math.max(0, Number(e.target.value) || 0)
                              ),
                            }))
                          }
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold min-h-[44px]"
                        />
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-800">미납 교재비 ({unpaidSales.length})</span>
            {unpaidSales.length === 0 ? (
              <p className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center">미납 교재비 없음</p>
            ) : (
              unpaidSales.map((sale) => {
                const isChecked = selectedSaleIds.includes(sale.id);
                return (
                  <div
                    key={sale.id}
                    className={`p-3 rounded-xl border space-y-2 ${
                      isChecked ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSale(sale.id)}
                      className="w-full flex items-center justify-between gap-2 text-left min-h-[44px]"
                    >
                      <span className="flex items-center gap-2">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-bold text-slate-900">{sale.textbookTitle}</span>
                      </span>
                      <span className="text-rose-600 font-black">
                        잔액 {formatCurrency(sale.unpaidAmount)}
                      </span>
                    </button>
                    {isChecked && (
                      <label className="block">
                        <span className="text-[11px] text-slate-500">이번 납부액</span>
                        <input
                          type="number"
                          min={0}
                          max={sale.unpaidAmount}
                          value={saleAmounts[sale.id] ?? 0}
                          onChange={(e) =>
                            setSaleAmounts((prev) => ({
                              ...prev,
                              [sale.id]: Math.min(
                                sale.unpaidAmount,
                                Math.max(0, Number(e.target.value) || 0)
                              ),
                            }))
                          }
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold min-h-[44px]"
                        />
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">결제 방법</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white min-h-[44px]"
              >
                <option value="card">카드</option>
                <option value="transfer">계좌이체</option>
                <option value="cash">현금</option>
                <option value="other">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">수납 일자</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white min-h-[44px]"
              />
            </div>
          </div>

          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="수납 메모 (선택)"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white min-h-[44px]"
          />

          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[11px]">이번 납부 합계</span>
              <span className="text-xs text-slate-300">
                수강료 {formatCurrency(selectedInvoiceTotal)} + 교재{' '}
                {formatCurrency(selectedSaleTotal)}
              </span>
            </div>
            <span className="text-xl font-black text-emerald-400">
              {formatCurrency(grandSelectedTotal)}
            </span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl min-h-[44px]"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={grandSelectedTotal <= 0}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white disabled:opacity-50 min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              수납 · 수입 반영 ({formatCurrency(grandSelectedTotal)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
