import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { TuitionInvoice, InvoiceStatus, PaymentMethod } from '@/types';
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusBadge
} from '@/utils/formatters';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  FileText,
  DollarSign,
  X,
  Save,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  Users
} from 'lucide-react';
import { CombinedPaymentModal } from './CombinedPaymentModal';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

export const TuitionManagementView: React.FC = () => {
  const { showToast, setSelectedStudentId, setActiveTab } = useApp();

  const [selectedMonth, setSelectedMonth] = useState('2025-08');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'invoices' | 'combined'>('invoices');

  // Combined payment modal
  const [combinedStudentForPay, setCombinedStudentForPay] = useState<any>(null);

  // Payment processing modal
  const [payModalInvoice, setPayModalInvoice] = useState<TuitionInvoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('card');
  const [payMemo, setPayMemo] = useState('');

  // Receipt modal
  const [receiptInvoice, setReceiptInvoice] = useState<TuitionInvoice | null>(null);

  // New Invoice Modal
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [newInvStudentId, setNewInvStudentId] = useState('');
  const [newInvAmount, setNewInvAmount] = useState(180000);
  const [newInvDiscount, setNewInvDiscount] = useState(0);
  const [newInvDueDate, setNewInvDueDate] = useState('2025-08-10');
  const [newInvNotes, setNewInvNotes] = useState('');

  const invoices = StorageService.getInvoices();
  const students = StorageService.getStudents();
  const settings = StorageService.getSettings();
  const tbStats = StorageService.getTextbookStats(selectedMonth);

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

  // Statistics for selected month
  const stats = useMemo(() => {
    const monthInvoices = invoices.filter((i) => i.yearMonth === selectedMonth);
    const totalBilled = monthInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaid = monthInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalUnpaid = monthInvoices.reduce((sum, i) => sum + i.unpaidAmount, 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    const unpaidCount = monthInvoices.filter((i) => i.status === 'unpaid' || i.status === 'partial').length;

    return { totalBilled, totalPaid, totalUnpaid, collectionRate, unpaidCount, totalCount: monthInvoices.length };
  }, [invoices, selectedMonth]);

  // Batch generate invoices for all active students for selected month
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
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

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-500">총 청구액 ({selectedMonth})</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(stats.totalBilled)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">발행 청구서 {stats.totalCount}건</p>
        </div>

        <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200 shadow-xs">
          <p className="text-xs font-bold text-emerald-800">수납 완료액</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
            {formatCurrency(stats.totalPaid)}
          </p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">수납률 {stats.collectionRate}%</p>
        </div>

        <div className="bg-rose-50/80 p-5 rounded-3xl border border-rose-200 shadow-xs">
          <p className="text-xs font-bold text-rose-800">미납 수강료</p>
          <p className="text-xl sm:text-2xl font-black text-rose-900 mt-1">
            {formatCurrency(stats.totalUnpaid)}
          </p>
          <p className="text-[11px] text-rose-700 font-semibold mt-1">미납 {stats.unpaidCount}건</p>
        </div>

        <div className="bg-indigo-50/80 p-5 rounded-3xl border border-indigo-200 shadow-xs">
          <p className="text-xs font-bold text-indigo-800">수납 진행률</p>
          <div className="w-full bg-indigo-200 h-3 rounded-full overflow-hidden mt-2">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${stats.collectionRate}%` }}
            />
          </div>
          <p className="text-[11px] text-indigo-700 font-bold text-right mt-1">{stats.collectionRate}% 완료</p>
        </div>
      </div>

      {/* Mode Switch Tabs & Filter Bar */}
      <div className="space-y-3">
        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setViewMode('invoices')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'invoices'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            수강료 개별 청구서 목록 ({filteredInvoices.length})
          </button>
          <button
            onClick={() => setViewMode('combined')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'combined'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            원생별 월간 통합 청구 및 수납 (수강료 + 교재비)
          </button>
        </div>

        {/* Filter and Month Selector Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
            >
              <option value="2025-08">2025년 8월</option>
              <option value="2025-07">2025년 7월</option>
              <option value="2025-06">2025년 6월</option>
              <option value="2025-05">2025년 5월</option>
            </select>

            {/* Status Filter */}
            {viewMode === 'invoices' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
              >
                <option value="ALL">전체 상태</option>
                <option value="paid">수납 완료</option>
                <option value="unpaid">미납</option>
                <option value="overdue">연체/기한초과</option>
              </select>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="원생 이름 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {viewMode === 'invoices' ? (
              <>조회 결과: <strong className="text-slate-900">{filteredInvoices.length}건</strong></>
            ) : (
              <>재원생: <strong className="text-slate-900">{students.length}명</strong></>
            )}
          </span>
        </div>
      </div>

      {viewMode === 'combined' ? (
        /* Combined Billing View per Student */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800">
              원생별 총 청구/수납/미납 현황 (수강료 + 교재비 자동 합산)
            </span>
            <span className="text-slate-500">
              * 항목별로 개별 관리되면서도 통합 수납이 가능합니다.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">원생명 / 학부모</th>
                  <th className="px-6 py-4 text-right">수강료 (청구/미납)</th>
                  <th className="px-6 py-4 text-right">교재비 (구매/미납)</th>
                  <th className="px-6 py-4 text-right">합산 총 청구액</th>
                  <th className="px-6 py-4 text-right">합산 총 미납액</th>
                  <th className="px-6 py-4 text-center">수납 상태</th>
                  <th className="px-6 py-4 text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {students
                  .filter((s) => !searchQuery.trim() || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((student) => {
                    const summary = StorageService.getStudentBillingSummary(student.id);
                    const hasUnpaid = (summary.totalUnpaid || 0) > 0;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedStudentId(student.id)}
                            className="font-bold text-slate-900 hover:text-indigo-600 text-left block"
                          >
                            {student.name}
                          </button>
                          <span className="text-[11px] text-slate-400">
                            {student.parentName} ({student.parentPhone})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(summary.tuitionBilled || 0)}</p>
                          {summary.tuitionUnpaid > 0 ? (
                            <p className="text-[11px] font-bold text-rose-600">미납: {formatCurrency(summary.tuitionUnpaid)}</p>
                          ) : (
                            <p className="text-[11px] text-emerald-600 font-semibold">전액 완납</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="font-bold text-slate-900">{formatCurrency(summary.textbookBilled || 0)}</p>
                          {summary.textbookUnpaid > 0 ? (
                            <p className="text-[11px] font-bold text-rose-600">미납: {formatCurrency(summary.textbookUnpaid)}</p>
                          ) : (summary.textbookBilled || 0) > 0 ? (
                            <p className="text-[11px] text-emerald-600 font-semibold">전액 완납</p>
                          ) : (
                            <p className="text-[11px] text-slate-400">-</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">
                          {formatCurrency(summary.totalBilled || 0)}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-rose-600">
                          {(summary.totalUnpaid || 0) > 0 ? formatCurrency(summary.totalUnpaid) : '₩0'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {(summary.totalUnpaid || 0) === 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 완납
                            </span>
                          ) : (summary.totalPaid || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700">
                              <AlertCircle className="w-3.5 h-3.5" /> 일부미납
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5" /> 전액미납
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {hasUnpaid && (
                              <button
                                onClick={() => setCombinedStudentForPay(student)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                              >
                                통합 수납
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedStudentId(student.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                            >
                              상세보기
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Invoices List */
        <div className="space-y-3">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">청구월</th>
                    <th className="py-3.5 px-4">원생 이름</th>
                    <th className="py-3.5 px-4">기본 수강료</th>
                    <th className="py-3.5 px-4">할인/감면</th>
                    <th className="py-3.5 px-4">최종 청구액</th>
                    <th className="py-3.5 px-4">납부액 / 미납액</th>
                    <th className="py-3.5 px-4">납부기한</th>
                    <th className="py-3.5 px-4">상태</th>
                    <th className="py-3.5 px-4 text-right">수납 / 영수증</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        해당 조건의 수납 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const badge = getInvoiceStatusBadge(inv.status);
                      return (
                        <tr key={inv.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                            {inv.yearMonth}
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => {
                                setSelectedStudentId(inv.studentId);
                                setActiveTab('students');
                              }}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                            >
                              {inv.studentName}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {formatCurrency(inv.baseTuition)}
                          </td>
                          <td className="py-3.5 px-4 text-rose-500 font-medium">
                            {inv.discountAmount > 0 ? `-${formatCurrency(inv.discountAmount)}` : '-'}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900">
                            {formatCurrency(inv.totalAmount)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-emerald-700">
                              {formatCurrency(inv.paidAmount)}
                            </span>
                            {inv.unpaidAmount > 0 && (
                              <span className="text-rose-600 font-bold ml-1">
                                (미납: {formatCurrency(inv.unpaidAmount)})
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {inv.dueDate}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {inv.status !== 'paid' ? (
                                <button
                                  onClick={() => handleOpenPayModal(inv)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                                >
                                  수납 결제
                                </button>
                              ) : (
                                <button
                                  onClick={() => setReceiptInvoice(inv)}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-xl transition-colors border border-slate-200 flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  영수증
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden space-y-3">
            {filteredInvoices.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400 font-medium border border-slate-200">
                해당 조건의 수납 내역이 없습니다.
              </div>
            ) : (
              filteredInvoices.map((inv) => {
                const badge = getInvoiceStatusBadge(inv.status);
                const st = students.find((s) => s.id === inv.studentId);

                return (
                  <div
                    key={inv.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudentId(inv.studentId);
                              setActiveTab('students');
                            }}
                            className="font-bold text-sm text-slate-900 hover:text-indigo-600 text-left"
                          >
                            {inv.studentName}
                          </button>
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {inv.yearMonth}월분 (기한: {inv.dueDate})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
                          {formatCurrency(inv.totalAmount)}
                        </span>
                        {inv.unpaidAmount > 0 ? (
                          <span className="text-xs font-bold text-rose-600">
                            미납 {formatCurrency(inv.unpaidAmount)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-600">
                            전액 완납
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500">
                        {st?.parentPhone && (
                          <a href={`tel:${st.parentPhone}`} className="text-indigo-600 font-medium hover:underline">
                            📞 {st.parentPhone}
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {inv.status !== 'paid' ? (
                          <button
                            onClick={() => handleOpenPayModal(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                          >
                            수납 결제
                          </button>
                        ) : (
                          <button
                            onClick={() => setReceiptInvoice(inv)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            영수증
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Combined Payment Modal */}
      {combinedStudentForPay && (
        <CombinedPaymentModal
          student={combinedStudentForPay}
          onSuccess={() => setCombinedStudentForPay(null)}
          onClose={() => setCombinedStudentForPay(null)}
        />
      )}

      {/* Payment Modal */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">수강료 수납 처리</h3>
                <p className="text-xs text-slate-500">{payModalInvoice.studentName} ({payModalInvoice.yearMonth}월)</p>
              </div>
              <button
                onClick={() => setPayModalInvoice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  납부 금액 (₩) <span className="text-rose-500">*</span>
                </label>
                <CurrencyInput
                  value={payAmount}
                  onChange={setPayAmount}
                  max={payModalInvoice.unpaidAmount}
                  showQuickButtons
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  남은 미납금: {formatCurrency(payModalInvoice.unpaidAmount)}
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
                      onClick={() => setPayMethod(m.id as any)}
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
                  onChange={(e) => setPayMemo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayModalInvoice(null)}
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
      )}

      {/* Official Academy Receipt Modal */}
      {receiptInvoice && (
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
                  onClick={() => setReceiptInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-8 space-y-6 bg-white text-slate-900 border-4 border-double border-slate-300 m-4 rounded-2xl">
              <div className="text-center border-b pb-4">
                <h3 className="text-2xl font-black tracking-widest text-slate-900">
                  수 강 료 납 부 영 수 증
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  영수증 번호: {receiptInvoice.receiptNumber || 'REC-202508-01'}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">원 생 성 명</span>
                  <span className="font-bold text-slate-900">{receiptInvoice.studentName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">수 납 년 월</span>
                  <span className="font-bold text-slate-900">{receiptInvoice.yearMonth}월분 피아노 수강료</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">납 부 금 액</span>
                  <span className="font-black text-indigo-700 text-sm">
                    {formatCurrency(receiptInvoice.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">결 제 방 식</span>
                  <span className="font-bold text-slate-800">
                    {receiptInvoice.paymentMethod === 'card' ? '신용카드' : receiptInvoice.paymentMethod === 'transfer' ? '계좌이체' : '현금'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">수 납 일 자</span>
                  <span className="font-mono text-slate-800">{receiptInvoice.paidDate || receiptInvoice.dueDate}</span>
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
      )}

      {/* New Custom Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">개별 수강료 청구서 발행</h3>
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">대상 원생</label>
                <select
                  value={newInvStudentId}
                  onChange={(e) => setNewInvStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.school} {s.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">기본 수강료 (₩)</label>
                  <CurrencyInput
                    value={newInvAmount}
                    onChange={setNewInvAmount}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">할인/감면액 (₩)</label>
                  <CurrencyInput
                    value={newInvDiscount}
                    onChange={setNewInvDiscount}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">납부 기한</label>
                <input
                  type="date"
                  value={newInvDueDate}
                  onChange={(e) => setNewInvDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">비고 / 메모</label>
                <input
                  type="text"
                  placeholder="예: 형제 할인 10,000원 적용"
                  value={newInvNotes}
                  onChange={(e) => setNewInvNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  청구서 발행
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
