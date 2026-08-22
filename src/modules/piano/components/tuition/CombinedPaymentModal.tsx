import React, { useState, useEffect } from 'react';
import { Student, TuitionInvoice, TextbookSale, PaymentMethod } from '@/types';
import { StorageService } from '@/services/storage';
import { useApp } from '@/context/AppContext';
import { X, CreditCard, CheckSquare, Square, FileText, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface CombinedPaymentModalProps {
  student: Student;
  onSuccess: () => void;
  onClose: () => void;
}

export const CombinedPaymentModal: React.FC<CombinedPaymentModalProps> = ({
  student,
  onSuccess,
  onClose
}) => {
  const { showToast, triggerRefresh } = useApp();

  const billingSummary = StorageService.getStudentBillingSummary(student.id);
  const unpaidInvoices = (billingSummary.invoices || []).filter((i) => i.unpaidAmount > 0);
  const unpaidSales = (billingSummary.textbookSales || []).filter((s) => s.unpaidAmount > 0);

  // Selected items to pay
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(unpaidInvoices.map((i) => i.id));
  const [selectedSaleIds, setSelectedSaleIds] = useState<string[]>(unpaidSales.map((s) => s.id));

  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');

  // Selected totals
  const selectedInvoiceTotal = unpaidInvoices
    .filter((i) => selectedInvoiceIds.includes(i.id))
    .reduce((sum, i) => sum + i.unpaidAmount, 0);

  const selectedSaleTotal = unpaidSales
    .filter((s) => selectedSaleIds.includes(s.id))
    .reduce((sum, s) => sum + s.unpaidAmount, 0);

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
      alert('납부할 항목을 1개 이상 선택해주세요.');
      return;
    }

    try {
      const textbookPayments = unpaidSales
        .filter((s) => selectedSaleIds.includes(s.id))
        .map((s) => ({ saleId: s.id, amount: s.unpaidAmount }));

      const res = StorageService.recordCombinedPayment({
        studentId: student.id,
        yearMonth: new Date().toISOString().slice(0, 7),
        tuitionAmount: selectedInvoiceTotal,
        textbookPayments,
        paymentMethod,
        paymentDate,
        memo: memo.trim() || undefined
      });

      showToast(
        `${student.name} 원생의 통합 수납 ₩${res.totalPaidAmount.toLocaleString()}원 처리가 완료되었습니다!`,
        'success'
      );
      triggerRefresh();
      onSuccess();
    } catch (err: any) {
      alert(err.message || '통합 수납 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {student.name} 원생 - 수강료 & 교재비 통합 수납
              </h3>
              <p className="text-xs text-slate-500">
                수강료와 미납 교재비를 선택하여 한 번에 수납 처리합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Section 1: 미납 수강료 선택 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                미납 수강료 청구서 ({unpaidInvoices.length}건)
              </span>
              <span className="text-[11px] text-slate-500">
                선택 합계: <strong className="text-indigo-600">{formatCurrency(selectedInvoiceTotal)}</strong>
              </span>
            </div>

            {unpaidInvoices.length === 0 ? (
              <p className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center">
                미납된 수강료 청구서가 없습니다.
              </p>
            ) : (
              <div className="space-y-1.5">
                {unpaidInvoices.map((inv) => {
                  const isChecked = selectedInvoiceIds.includes(inv.id);
                  return (
                    <div
                      key={inv.id}
                      onClick={() => toggleInvoice(inv.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-slate-900">{inv.yearMonth}월 수강료</span>
                          <span className="text-slate-400 text-[11px] ml-2">납부기한: {inv.dueDate}</span>
                        </div>
                      </div>
                      <div className="text-right font-black text-rose-600">
                        {formatCurrency(inv.unpaidAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: 미납 교재비 선택 */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                미납 교재비 목록 ({unpaidSales.length}건)
              </span>
              <span className="text-[11px] text-slate-500">
                선택 합계: <strong className="text-amber-600">{formatCurrency(selectedSaleTotal)}</strong>
              </span>
            </div>

            {unpaidSales.length === 0 ? (
              <p className="p-3 bg-slate-50 rounded-xl text-slate-400 text-center">
                미납된 교재비가 없습니다.
              </p>
            ) : (
              <div className="space-y-1.5">
                {unpaidSales.map((sale) => {
                  const isChecked = selectedSaleIds.includes(sale.id);
                  return (
                    <div
                      key={sale.id}
                      onClick={() => toggleSale(sale.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <span className="font-bold text-slate-900">{sale.textbookTitle}</span>
                          <span className="text-slate-400 text-[11px] ml-2">
                            ({sale.quantity}권 / 판매일: {sale.saleDate})
                          </span>
                        </div>
                      </div>
                      <div className="text-right font-black text-rose-600">
                        {formatCurrency(sale.unpaidAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: 결제 수단 및 날짜 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">결제 방법</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
              >
                <option value="card">신용 / 체크카드</option>
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
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Section 4: 메모 */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">수납 비고 / 메모</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 학부모 방문 카드 일괄 결제 (수강료+교재)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          {/* Final Summary Card */}
          <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block">선택 항목 합산 결제액</span>
              <span className="text-xs text-slate-300">
                수강료 ₩{selectedInvoiceTotal.toLocaleString()} + 교재비 ₩{selectedSaleTotal.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-emerald-400">
                {formatCurrency(grandSelectedTotal)}
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={grandSelectedTotal <= 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              통합 수납 완료 ({formatCurrency(grandSelectedTotal)})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
