import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { TuitionInvoice, PaymentMethod, Student } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useStorageRefresh } from '@/hooks';
import { getRecentYearMonths } from '@/core/finance/categories';
import { CreditCard, Plus, Clock } from 'lucide-react';
import { CombinedPaymentModal } from './CombinedPaymentModal';
import { TuitionSummaryCards } from './TuitionSummaryCards';
import { TuitionFilterBar } from './TuitionFilterBar';
import { TuitionCombinedBillingView } from './TuitionCombinedBillingView';
import { TuitionInvoiceListView } from './TuitionInvoiceListView';
import { TuitionPaymentModal } from './TuitionPaymentModal';
import { TuitionReceiptModal } from './TuitionReceiptModal';
import { TuitionNewInvoiceModal } from './TuitionNewInvoiceModal';
import { ViewMode } from './tuitionViewTypes';
import {
  getCurrentYearMonth,
  defaultDueDateForMonth,
  formatYearMonthLabel,
} from './tuitionUtils';

export const TuitionManagementView: React.FC = () => {
  const { showToast, setSelectedStudentId, setActiveTab, triggerRefresh } = useApp();
  const refreshKey = useStorageRefresh();

  const monthOptions = useMemo(() => getRecentYearMonths(12), []);
  const initialMonth = getCurrentYearMonth();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('invoices');

  const [combinedStudentForPay, setCombinedStudentForPay] = useState<Student | null>(null);

  const [payModalInvoice, setPayModalInvoice] = useState<TuitionInvoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [payMemo, setPayMemo] = useState('');

  const [receiptInvoice, setReceiptInvoice] = useState<TuitionInvoice | null>(null);

  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [newInvStudentId, setNewInvStudentId] = useState('');
  const [newInvAmount, setNewInvAmount] = useState(180000);
  const [newInvDiscount, setNewInvDiscount] = useState(0);
  const [newInvDueDate, setNewInvDueDate] = useState(defaultDueDateForMonth(initialMonth));
  const [newInvNotes, setNewInvNotes] = useState('');

  const invoices = useMemo(() => StorageService.getInvoices(), [refreshKey]);
  const students = useMemo(() => StorageService.getStudents(), [refreshKey]);
  const settings = useMemo(() => StorageService.getSettings(), [refreshKey]);

  useEffect(() => {
    setNewInvDueDate(defaultDueDateForMonth(selectedMonth));
  }, [selectedMonth]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedMonth && inv.yearMonth !== selectedMonth) return false;
      if (statusFilter !== 'ALL' && inv.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!inv.studentName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [invoices, selectedMonth, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const monthInvoices = invoices.filter((i) => i.yearMonth === selectedMonth);
    const totalBilled = monthInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = monthInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalUnpaid = monthInvoices.reduce((sum, i) => sum + i.unpaidAmount, 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    const unpaidCount = monthInvoices.filter((i) => i.status === 'unpaid' || i.status === 'partial').length;

    return { totalBilled, totalPaid, totalUnpaid, collectionRate, unpaidCount, totalCount: monthInvoices.length };
  }, [invoices, selectedMonth]);

  const handleBatchGenerate = () => {
    const count = StorageService.generateMonthlyInvoicesForAllActive(selectedMonth);
    triggerRefresh();
    if (count === 0) {
      showToast(`${formatYearMonthLabel(selectedMonth)} 청구서가 이미 모든 재원생에게 발행되어 있습니다.`, 'info');
    } else {
      showToast(`${formatYearMonthLabel(selectedMonth)} 수강료 청구서 ${count}건이 일괄 발행되었습니다.`, 'success');
    }
  };

  const handleOpenPayModal = (inv: TuitionInvoice) => {
    setPayModalInvoice(inv);
    setPayAmount(inv.unpaidAmount);
    setPayMethod('card');
    setPayMemo('');
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInvoice) return;

    if (payAmount <= 0) {
      showToast('납부 금액은 0원보다 커야 합니다.', 'warning');
      return;
    }
    if (payAmount > payModalInvoice.unpaidAmount) {
      showToast('미납 금액을 초과할 수 없습니다.', 'warning');
      return;
    }

    const updated = StorageService.recordPayment(payModalInvoice.id, payAmount, payMethod, payMemo);
    if (!updated) {
      showToast('수납 처리에 실패했습니다.', 'error');
      return;
    }

    triggerRefresh();
    showToast(`${payModalInvoice.studentName} 원생 ${formatCurrency(payAmount)} 수납 완료`, 'success');
    setPayModalInvoice(null);
    setReceiptInvoice(updated);
  };

  const handleCreateCustomInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === newInvStudentId);
    if (!st) {
      showToast('원생을 선택해주세요.', 'warning');
      return;
    }

    const total = Math.max(0, Number(newInvAmount) - Number(newInvDiscount));
    if (total <= 0) {
      showToast('청구 금액은 0원보다 커야 합니다.', 'warning');
      return;
    }

    StorageService.saveInvoice({
      studentId: st.id,
      studentName: st.name,
      yearMonth: selectedMonth,
      baseTuition: Number(newInvAmount),
      baseFee: Number(newInvAmount),
      discountAmount: Number(newInvDiscount),
      discount: Number(newInvDiscount),
      additionalAmount: 0,
      totalAmount: total,
      paidAmount: 0,
      unpaidAmount: total,
      dueDate: newInvDueDate,
      status: 'unpaid',
      notes: newInvNotes,
    });

    triggerRefresh();
    showToast(`${st.name} 원생의 청구서가 등록되었습니다.`, 'success');
    setIsNewInvoiceModalOpen(false);
  };

  const handleSelectStudentFromInvoice = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  const openNewInvoiceModal = () => {
    const firstStudent = students.find((s) => s.status === 'active') || students[0];
    setNewInvStudentId(firstStudent?.id || '');
    setNewInvAmount(firstStudent?.tuitionFee || settings.defaultTuitionFee || 180000);
    setNewInvDiscount(0);
    setNewInvDueDate(
      defaultDueDateForMonth(selectedMonth, firstStudent?.paymentDay || settings.defaultPaymentDay || 10)
    );
    setNewInvNotes('');
    setIsNewInvoiceModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            수강료 및 수납 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            원생별 수강료 청구서 발행, 수납 처리, 미납 관리 및 영수증 발급
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleBatchGenerate}
            disabled={students.filter((s) => s.status === 'active').length === 0}
            className="px-4 py-2.5 min-h-[44px] bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 text-xs sm:text-sm font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Clock className="w-4 h-4" />
            {formatYearMonthLabel(selectedMonth)} 청구서 일괄 생성
          </button>
          <button
            onClick={openNewInvoiceModal}
            disabled={students.length === 0}
            className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            개별 청구서 발행
          </button>
        </div>
      </div>

      <TuitionSummaryCards selectedMonth={formatYearMonthLabel(selectedMonth)} stats={stats} />

      <TuitionFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedMonth={selectedMonth}
        onSelectedMonthChange={setSelectedMonth}
        monthOptions={monthOptions}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        filteredInvoicesCount={filteredInvoices.length}
        studentsCount={students.length}
      />

      {viewMode === 'combined' ? (
        <TuitionCombinedBillingView
          students={students}
          selectedMonth={selectedMonth}
          searchQuery={searchQuery}
          onSelectStudent={setSelectedStudentId}
          onCombinedPay={setCombinedStudentForPay}
        />
      ) : (
        <TuitionInvoiceListView
          filteredInvoices={filteredInvoices}
          students={students}
          onSelectStudent={handleSelectStudentFromInvoice}
          onOpenPayModal={handleOpenPayModal}
          onOpenReceipt={setReceiptInvoice}
        />
      )}

      {combinedStudentForPay && (
        <CombinedPaymentModal
          student={combinedStudentForPay}
          yearMonth={selectedMonth}
          onSuccess={() => {
            setCombinedStudentForPay(null);
            triggerRefresh();
          }}
          onClose={() => setCombinedStudentForPay(null)}
        />
      )}

      {payModalInvoice && (
        <TuitionPaymentModal
          invoice={payModalInvoice}
          payAmount={payAmount}
          onPayAmountChange={setPayAmount}
          payMethod={payMethod}
          onPayMethodChange={setPayMethod}
          payMemo={payMemo}
          onPayMemoChange={setPayMemo}
          onSubmit={handleProcessPayment}
          onClose={() => setPayModalInvoice(null)}
        />
      )}

      {receiptInvoice && (
        <TuitionReceiptModal
          invoice={receiptInvoice}
          settings={settings}
          onClose={() => setReceiptInvoice(null)}
        />
      )}

      {isNewInvoiceModalOpen && (
        <TuitionNewInvoiceModal
          students={students}
          studentId={newInvStudentId}
          onStudentIdChange={(id) => {
            setNewInvStudentId(id);
            const st = students.find((s) => s.id === id);
            if (st) {
              setNewInvAmount(st.tuitionFee || settings.defaultTuitionFee || 180000);
              setNewInvDueDate(defaultDueDateForMonth(selectedMonth, st.paymentDay || 10));
            }
          }}
          amount={newInvAmount}
          onAmountChange={setNewInvAmount}
          discount={newInvDiscount}
          onDiscountChange={setNewInvDiscount}
          dueDate={newInvDueDate}
          onDueDateChange={setNewInvDueDate}
          notes={newInvNotes}
          onNotesChange={setNewInvNotes}
          onSubmit={handleCreateCustomInvoice}
          onClose={() => setIsNewInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
};
