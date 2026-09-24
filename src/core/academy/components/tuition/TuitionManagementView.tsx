import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { getCustomerLabel } from '@/core/industry/industryUi';
import { useModuleLabels } from '@/core/labels';
import { StudentService } from '@/core/students';
import { TuitionService } from '@/core/finance';
import { TuitionInvoice, PaymentMethod, Student } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { useStorageRefresh } from '@/hooks';
import { buildYearMonthOptions } from '@/core/finance/categories';
import {
  buildInvoiceNotes,
  collectPendingRecitalFees,
  collectPendingTextbookSales,
  computeInvoiceTotal,
} from '@/core/academy/utils/invoiceExtras';
import { CreditCard, Plus, Clock, Send } from 'lucide-react';
import { PageHeader } from '@/shared/components';
import { CombinedPaymentModal } from './CombinedPaymentModal';
import { todayIsoLocal } from '@/shared/utils/localDate';
import { TuitionSummaryCards } from './TuitionSummaryCards';
import { TuitionFilterBar } from './TuitionFilterBar';
import { TuitionCombinedBillingView } from './TuitionCombinedBillingView';
import { TuitionInvoiceListView } from './TuitionInvoiceListView';
import { TuitionPaymentModal } from './TuitionPaymentModal';
import { TuitionReceiptModal } from './TuitionReceiptModal';
import { TuitionNewInvoiceModal } from './TuitionNewInvoiceModal';
import { TuitionBulkSendModal } from './TuitionBulkSendModal';
import { ViewMode } from './tuitionViewTypes';
import {
  getCurrentYearMonth,
  defaultDueDateForMonth,
  formatYearMonthLabel,
} from './tuitionUtils';
import { isMonthlyBillingStudent, filterMonthlyBillingStudents } from '@/core/academy/utils/billingMode';

export const TuitionManagementView: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const { showToast, setSelectedStudentId, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const labels = useModuleLabels();
  const customerLabel = labels.customer.singular || getCustomerLabel(industry);
  const refreshKey = useStorageRefresh('finance');

  const initialMonth = getCurrentYearMonth();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('invoices');

  const [combinedStudentForPay, setCombinedStudentForPay] = useState<Student | null>(null);

  const [payModalInvoice, setPayModalInvoice] = useState<TuitionInvoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('onsite_card');
  const [payMemo, setPayMemo] = useState('');
  const [payDate, setPayDate] = useState(todayIsoLocal);
  const [cashReceiptIssued, setCashReceiptIssued] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [isBulkSendOpen, setIsBulkSendOpen] = useState(false);

  const [receiptInvoice, setReceiptInvoice] = useState<TuitionInvoice | null>(null);

  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [newInvStudentId, setNewInvStudentId] = useState('');
  const [newInvAmount, setNewInvAmount] = useState(180000);
  const [newInvDiscount, setNewInvDiscount] = useState(0);
  const [newInvDueDate, setNewInvDueDate] = useState(defaultDueDateForMonth(initialMonth));
  const [newInvNotes, setNewInvNotes] = useState('');
  const [newInvIncludeExtras, setNewInvIncludeExtras] = useState(false);
  const [newInvExtraFee, setNewInvExtraFee] = useState(0);

  const invoices = useMemo(() => TuitionService.getInvoices(), [refreshKey]);
  const students = useMemo(() => StudentService.getStudents(), [refreshKey]);
  const settings = useMemo(() => TuitionService.getSettings(), [refreshKey]);

  const monthOptions = useMemo(
    () =>
      buildYearMonthOptions({
        dataYearMonths: invoices.map((i) => i.yearMonth),
      }),
    [invoices]
  );
  const extrasPreview = useMemo(() => {
    if (!newInvStudentId) {
      return { textbookFee: 0, textbookCount: 0, recitalFee: 0, recitalLabel: '' };
    }
    const pending = collectPendingTextbookSales(
      TuitionService.getTextbookSales(),
      newInvStudentId
    );
    const recitalItems = collectPendingRecitalFees({
      events: TuitionService.getEvents(),
      studentId: newInvStudentId,
      yearMonth: selectedMonth,
      existingInvoices: invoices,
    });
    return {
      textbookFee: pending.reduce((s, x) => s + x.unpaidAmount, 0),
      textbookCount: pending.length,
      recitalFee: recitalItems.reduce((s, x) => s + x.amount, 0),
      recitalLabel: recitalItems.map((x) => x.label).join(', '),
    };
  }, [newInvStudentId, selectedMonth, invoices, refreshKey]);

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

  const handleBatchGenerate = async () => {
    const count = await TuitionService.generateMonthlyInvoicesForAllActive(selectedMonth);
    if (count === 0) {
      showToast(`${formatYearMonthLabel(selectedMonth)} 청구서가 이미 모든 재원 ${customerLabel}에게 발행되어 있습니다.`, 'info');
    } else {
      showToast(
        `${formatYearMonthLabel(selectedMonth)} 청구서 ${count}건을 초안으로 생성했습니다. [발송]으로 전달하세요.`,
        'success'
      );
    }
  };

  const handleOpenPayModal = (inv: TuitionInvoice) => {
    setPayModalInvoice(inv);
    setPayAmount(inv.unpaidAmount);
    setPayMethod('onsite_card');
    setPayMemo('');
    setPayDate(todayIsoLocal());
    setCashReceiptIssued(false);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
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

    try {
      const updated = await TuitionService.recordPayment(
        payModalInvoice.id,
        payAmount,
        payMethod,
        payMemo,
        payDate,
        { cashReceiptIssued }
      );
      if (!updated) {
        showToast('수납 처리에 실패했습니다.', 'error');
        return;
      }

      showToast(`${payModalInvoice.studentName} ${customerLabel} ${formatCurrency(payAmount)} 수납 완료`, 'success');
      setPayModalInvoice(null);
      setReceiptInvoice(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '수납 처리에 실패했습니다.', 'error');
    }
  };

  const handleSendInvoice = (inv: TuitionInvoice) => {
    const sent = TuitionService.sendInvoice(inv.id);
    if (!sent) {
      showToast('청구서 발송에 실패했습니다.', 'error');
      return;
    }
    showToast(`${inv.studentName} ${customerLabel}에게 청구서를 발송했습니다.`, 'success');
  };

  const handleSendSelected = () => {
    if (selectedInvoiceIds.length === 0) {
      showToast('발송할 청구서를 선택해주세요.', 'warning');
      return;
    }
    const count = TuitionService.sendInvoices(selectedInvoiceIds);
    setSelectedInvoiceIds([]);
    showToast(`청구서 ${count}건을 발송했습니다.`, 'success');
  };

  const handleBulkSend = (payload: {
    studentIds: string[];
    title: string;
    amount: number;
    dueDate: string;
    notes?: string;
  }) => {
    const result = TuitionService.bulkCreateAndSendInvoices({
      ...payload,
      yearMonth: selectedMonth,
    });
    setIsBulkSendOpen(false);
    showToast(
      `청구서 ${result.created}건 생성 · ${result.sent}건 발송 완료`,
      result.created > 0 ? 'success' : 'warning'
    );
  };

  const monthlyBillingStudents = useMemo(
    () => filterMonthlyBillingStudents(students, { activeOnly: true }),
    [students]
  );

  const handleCreateCustomInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === newInvStudentId);
    if (!st) {
      showToast(`${customerLabel}을(를) 선택해주세요.`, 'warning');
      return;
    }
    if (!isMonthlyBillingStudent(st)) {
      showToast('회차권 원생은 월 청구서를 발행하지 않습니다. 회차권을 등록해 주세요.', 'warning');
      return;
    }

    const pendingSales = newInvIncludeExtras
      ? collectPendingTextbookSales(TuitionService.getTextbookSales(), st.id)
      : [];
    const recitalItems = newInvIncludeExtras
      ? collectPendingRecitalFees({
          events: TuitionService.getEvents(),
          studentId: st.id,
          yearMonth: selectedMonth,
          existingInvoices: invoices,
        })
      : [];
    const textbookFee = pendingSales.reduce((sum, s) => sum + s.unpaidAmount, 0);
    const recitalFee = recitalItems.reduce((sum, i) => sum + i.amount, 0);
    const manualExtra = Math.max(0, Number(newInvExtraFee) || 0);
    const extraFee = recitalFee + manualExtra;
    const baseFee = Number(newInvAmount) || 0;
    const discount = Number(newInvDiscount) || 0;
    const total = computeInvoiceTotal({
      baseFee,
      discount,
      textbookFee,
      extraFee,
    });

    if (total <= 0) {
      showToast('청구 금액은 0원보다 커야 합니다.', 'warning');
      return;
    }

    const linkedExtraItems = [
      ...recitalItems,
      ...(manualExtra > 0
        ? [
            {
              id: `manual-${Date.now()}`,
              label: '기타',
              amount: manualExtra,
              sourceType: 'manual' as const,
            },
          ]
        : []),
    ];

    const saved = TuitionService.saveInvoice({
      studentId: st.id,
      studentName: st.name,
      yearMonth: selectedMonth,
      title: `${selectedMonth} 수강료`,
      baseTuition: baseFee,
      baseFee,
      discountAmount: discount,
      discount,
      textbookFee,
      extraFee,
      extraFeeLabel: linkedExtraItems.map((i) => i.label).join(', ') || undefined,
      additionalAmount: 0,
      totalAmount: total,
      paidAmount: 0,
      unpaidAmount: total,
      dueDate: newInvDueDate,
      status: 'unpaid',
      notes:
        newInvNotes.trim() ||
        buildInvoiceNotes({
          yearMonth: selectedMonth,
          textbookCount: pendingSales.length,
          extraItems: linkedExtraItems,
        }),
      includeExtras: newInvIncludeExtras,
      linkedTextbookSaleIds:
        pendingSales.length > 0 ? pendingSales.map((s) => s.id) : undefined,
      linkedExtraItems: linkedExtraItems.length > 0 ? linkedExtraItems : undefined,
      invoiceSent: false,
      sentAt: null,
    });

    if (pendingSales.length > 0) {
      TuitionService.linkTextbookSalesToInvoice(
        pendingSales.map((s) => s.id),
        saved.id
      );
    }

    showToast(`${st.name} ${customerLabel}의 청구서 초안이 등록되었습니다. [발송]으로 전달하세요.`, 'success');
    setIsNewInvoiceModalOpen(false);
  };

  const handleSelectStudentFromInvoice = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  const openNewInvoiceModal = () => {
    const eligible = monthlyBillingStudents;
    if (eligible.length === 0) {
      showToast('월 청구 대상 원생이 없습니다. 회차권 원생은 개별 청구서를 발행하지 않습니다.', 'warning');
      return;
    }
    const firstStudent = eligible[0];
    setNewInvStudentId(firstStudent.id);
    setNewInvAmount(firstStudent.tuitionFee || settings.defaultTuitionFee || 180000);
    setNewInvDiscount(0);
    setNewInvDueDate(
      defaultDueDateForMonth(selectedMonth, firstStudent.paymentDay || settings.defaultPaymentDay || 10)
    );
    setNewInvNotes('');
    setNewInvIncludeExtras(settings.includeExtrasInMonthlyInvoice === true);
    setNewInvExtraFee(0);
    setIsNewInvoiceModalOpen(true);
  };

  const billingActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleBatchGenerate}
        disabled={students.filter((s) => s.status === 'active').length === 0}
        className="px-4 py-2.5 min-h-[44px] bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-700 text-xs sm:text-sm font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <Clock className="w-4 h-4" />
        {formatYearMonthLabel(selectedMonth)} 초안 일괄 생성
      </button>
      <button
        type="button"
        onClick={() => setIsBulkSendOpen(true)}
        disabled={students.filter((s) => s.status === 'active').length === 0}
        className="px-4 py-2.5 min-h-[44px] bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        <Send className="w-4 h-4" />
        일괄 청구 발송
      </button>
      {selectedInvoiceIds.length > 0 && (
        <button
          type="button"
          onClick={handleSendSelected}
          className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          선택 {selectedInvoiceIds.length}건 발송
        </button>
      )}
      <button
        type="button"
        onClick={openNewInvoiceModal}
        disabled={students.length === 0}
        className="px-4 py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        개별 청구서 초안
      </button>
    </div>
  );

  return (
    <div className={embedded ? 'space-y-4 pb-2' : 'space-y-4 pb-4'}>
      {embedded ? (
        <>
          <TuitionSummaryCards selectedMonth={formatYearMonthLabel(selectedMonth)} stats={stats} />
          <div className="flex flex-wrap justify-end gap-2">{billingActions}</div>
        </>
      ) : (
        <>
          <PageHeader
            icon={<CreditCard className="w-6 h-6" />}
            title="수강료 및 수납 관리"
            description={`${customerLabel}별 수강료 청구서 발행, 수납 처리, 미납 관리 및 영수증 발급`}
            actions={billingActions}
          />
          <TuitionSummaryCards selectedMonth={formatYearMonthLabel(selectedMonth)} stats={stats} />
        </>
      )}

      <TuitionFilterBar
        customerLabel={customerLabel}
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
          customerLabel={customerLabel}
          students={students}
          selectedMonth={selectedMonth}
          searchQuery={searchQuery}
          onSelectStudent={setSelectedStudentId}
          onCombinedPay={setCombinedStudentForPay}
        />
      ) : (
        <TuitionInvoiceListView
          customerLabel={customerLabel}
          filteredInvoices={filteredInvoices}
          students={students}
          selectedIds={selectedInvoiceIds}
          onToggleSelect={(id) =>
            setSelectedInvoiceIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onToggleSelectAll={() => {
            if (
              filteredInvoices.length > 0 &&
              filteredInvoices.every((inv) => selectedInvoiceIds.includes(inv.id))
            ) {
              setSelectedInvoiceIds([]);
            } else {
              setSelectedInvoiceIds(filteredInvoices.map((inv) => inv.id));
            }
          }}
          onSelectStudent={handleSelectStudentFromInvoice}
          onOpenPayModal={handleOpenPayModal}
          onOpenReceipt={setReceiptInvoice}
          onSendInvoice={handleSendInvoice}
        />
      )}

      {combinedStudentForPay && (
        <CombinedPaymentModal
          customerLabel={customerLabel}
          student={combinedStudentForPay}
          yearMonth={selectedMonth}
          onSuccess={() => {
            setCombinedStudentForPay(null);
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
          payDate={payDate}
          onPayDateChange={setPayDate}
          cashReceiptIssued={cashReceiptIssued}
          onCashReceiptIssuedChange={setCashReceiptIssued}
          onSubmit={handleProcessPayment}
          onClose={() => setPayModalInvoice(null)}
        />
      )}

      {isBulkSendOpen && (
        <TuitionBulkSendModal
          customerLabel={customerLabel}
          students={students}
          yearMonth={selectedMonth}
          defaultAmount={settings.defaultTuitionFee || 180000}
          defaultDueDate={defaultDueDateForMonth(selectedMonth, settings.defaultPaymentDay || 10)}
          onSubmit={handleBulkSend}
          onClose={() => setIsBulkSendOpen(false)}
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
          customerLabel={customerLabel}
          students={monthlyBillingStudents}
          studentId={newInvStudentId}
          onStudentIdChange={(id) => {
            setNewInvStudentId(id);
            const st = monthlyBillingStudents.find((s) => s.id === id);
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
          includeExtras={newInvIncludeExtras}
          onIncludeExtrasChange={setNewInvIncludeExtras}
          textbookFeePreview={extrasPreview.textbookFee}
          textbookCountPreview={extrasPreview.textbookCount}
          recitalFeePreview={extrasPreview.recitalFee}
          recitalLabelPreview={extrasPreview.recitalLabel}
          extraFee={newInvExtraFee}
          onExtraFeeChange={setNewInvExtraFee}
          onSubmit={handleCreateCustomInvoice}
          onClose={() => setIsNewInvoiceModalOpen(false)}
        />
      )}
    </div>
  );
};
