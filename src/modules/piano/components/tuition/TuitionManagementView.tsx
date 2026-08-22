import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { TuitionInvoice, PaymentMethod, Student } from '@/types';
import { formatCurrency } from '@/utils/formatters';
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

export const TuitionManagementView: React.FC = () => {
  const { showToast, setSelectedStudentId, setActiveTab } = useApp();

  const [selectedMonth, setSelectedMonth] = useState('2025-08');
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
  const [newInvDueDate, setNewInvDueDate] = useState('2025-08-10');
  const [newInvNotes, setNewInvNotes] = useState('');

  const invoices = StorageService.getInvoices();
  const students = StorageService.getStudents();
  const settings = StorageService.getSettings();

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
    const count = StorageService.batchGenerateMonthlyInvoices(selectedMonth);
    if (count === 0) {
      showToast(`${selectedMonth}월 청구서가 이미 모든 재원생에게 발행되어 있습니다.`, 'info');
    } else {
      showToast(`${selectedMonth}월 수강료 청구서 ${count}건이 일괄 발행되었습니다.`, 'success');
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

    StorageService.recordPayment(payModalInvoice.id, payAmount, payMethod, payMemo);
    showToast(`${payModalInvoice.studentName} 원생 ${formatCurrency(payAmount)} 수납 완료`, 'success');
    setPayModalInvoice(null);
  };

  const handleCreateCustomInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === newInvStudentId);
    if (!st) {
      showToast('원생을 선택해주세요.', 'warning');
      return;
    }

    const total = Math.max(0, Number(newInvAmount) - Number(newInvDiscount));

    StorageService.saveInvoice({
      studentId: st.id,
      studentName: st.name,
      yearMonth: selectedMonth,
      baseTuition: Number(newInvAmount),
      discountAmount: Number(newInvDiscount),
      additionalAmount: 0,
      totalAmount: total,
      paidAmount: 0,
      unpaidAmount: total,
      dueDate: newInvDueDate,
      status: 'unpaid',
      notes: newInvNotes
    });

    showToast(`${st.name} 원생의 청구서가 등록되었습니다.`, 'success');
    setIsNewInvoiceModalOpen(false);
  };

  const handleSelectStudentFromInvoice = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
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
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Clock className="w-4 h-4" />
            {selectedMonth}월 청구서 일괄 생성
          </button>
          <button
            onClick={() => {
              setNewInvStudentId(students[0]?.id || '');
              setNewInvAmount(180000);
              setIsNewInvoiceModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            개별 청구서 발행
          </button>
        </div>
      </div>

      <TuitionSummaryCards selectedMonth={selectedMonth} stats={stats} />

      <TuitionFilterBar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedMonth={selectedMonth}
        onSelectedMonthChange={setSelectedMonth}
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
          onSuccess={() => setCombinedStudentForPay(null)}
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
          onStudentIdChange={setNewInvStudentId}
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
