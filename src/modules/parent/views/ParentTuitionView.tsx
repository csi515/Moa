import React, { useMemo, useState } from 'react';
import { StorageService } from '@/services/storage';
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusBadge,
} from '@/utils/formatters';
import { normalizeIndustryType, type IndustryType } from '@/core/industry/types';
import type { Student } from '@/types';
import { Section } from './shared';

function statusLabel(status: 'paid' | 'partial' | 'unpaid'): string {
  if (status === 'paid') return '완납';
  if (status === 'partial') return '일부 납부';
  return '미납';
}

export function ParentTuitionView({
  student,
  industryType = 'piano',
}: {
  student: Student;
  industryType?: IndustryType | string;
}) {
  const industry = normalizeIndustryType(industryType);
  const showTextbooks = industry === 'piano';

  const allSummary = StorageService.getStudentBillingSummary(student.id);
  const invoices = StorageService.getInvoices().filter((i) => i.studentId === student.id);
  const sales = showTextbooks ? StorageService.getTextbookSalesByStudentId(student.id) : [];
  const payments = showTextbooks
    ? StorageService.getTextbookPayments().filter((p) => p.studentId === student.id)
    : [];

  const monthOptions = useMemo(() => {
    const set = new Set<string>();
    invoices.forEach((i) => set.add(i.yearMonth));
    sales.forEach((s) => set.add(s.saleDate.slice(0, 7)));
    const list = Array.from(set).sort((a, b) => b.localeCompare(a));
    if (list.length === 0) {
      list.push(new Date().toISOString().slice(0, 7));
    }
    return list.slice(0, 12);
  }, [invoices, sales]);

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]);
  const monthSummary = StorageService.getStudentBillingSummary(student.id, selectedMonth);
  const monthInvoices = invoices.filter((i) => i.yearMonth === selectedMonth);
  const monthSales = sales.filter((s) => s.saleDate.startsWith(selectedMonth));

  const feeTitle =
    industry === 'daycare'
      ? '보육료'
      : industry === 'pilates'
        ? '수강료'
        : '월회비';

  const grandUnpaid = allSummary.grandUnpaid ?? allSummary.totalUnpaid;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
        <div>
          <p className="text-xs text-slate-500">전체 미납</p>
          <p
            className={`text-2xl font-black ${
              grandUnpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(grandUnpaid)}
          </p>
        </div>
        {showTextbooks && (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500">{feeTitle} 미납</p>
              <p
                className={`text-sm font-black ${
                  allSummary.tuitionUnpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(allSummary.tuitionUnpaid)}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[10px] font-bold text-slate-500">교재비 미납</p>
              <p
                className={`text-sm font-black ${
                  allSummary.textbookUnpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(allSummary.textbookUnpaid)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-black text-slate-900">월별 내역</h3>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-slate-100 overflow-hidden text-sm">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-500">
            <span>항목</span>
            <span className="text-right">청구</span>
            <span className="text-right">납부</span>
            <span className="text-right">미납</span>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 border-t border-slate-50 items-center">
            <span className="font-bold text-slate-900">{feeTitle}</span>
            <span className="font-mono text-right text-slate-700">
              {formatCurrency(monthSummary.tuitionBilled)}
            </span>
            <span className="font-mono text-right text-slate-700">
              {formatCurrency(monthSummary.tuitionPaid)}
            </span>
            <span
              className={`font-mono text-right font-bold ${
                monthSummary.tuitionUnpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatCurrency(monthSummary.tuitionUnpaid)}
            </span>
          </div>
          {showTextbooks && (
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 border-t border-slate-50 items-center">
              <span className="font-bold text-slate-900">교재비</span>
              <span className="font-mono text-right text-slate-700">
                {formatCurrency(monthSummary.textbookBilled)}
              </span>
              <span className="font-mono text-right text-slate-700">
                {formatCurrency(monthSummary.textbookPaid)}
              </span>
              <span
                className={`font-mono text-right font-bold ${
                  monthSummary.textbookUnpaid > 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatCurrency(monthSummary.textbookUnpaid)}
              </span>
            </div>
          )}
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 border-t border-slate-200 bg-slate-50/80 items-center font-bold">
            <span>합계</span>
            <span className="font-mono text-right">
              {formatCurrency(monthSummary.tuitionBilled + monthSummary.textbookBilled)}
            </span>
            <span className="font-mono text-right">
              {formatCurrency(monthSummary.tuitionPaid + monthSummary.textbookPaid)}
            </span>
            <span
              className={`font-mono text-right ${
                (monthSummary.grandUnpaid ?? monthSummary.totalUnpaid) > 0
                  ? 'text-rose-600'
                  : 'text-emerald-600'
              }`}
            >
              {formatCurrency(monthSummary.grandUnpaid ?? monthSummary.totalUnpaid)}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500">
          {selectedMonth} · {feeTitle} {statusLabel(monthSummary.tuitionStatus as 'paid' | 'partial' | 'unpaid')}
          {showTextbooks
            ? ` · 교재 ${statusLabel(monthSummary.textbookStatus as 'paid' | 'partial' | 'unpaid')}`
            : ''}
        </p>
      </div>

      <Section title={`${feeTitle} 청구서`}>
        {monthInvoices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">해당 월 청구가 없습니다.</p>
        ) : (
          monthInvoices.map((inv) => (
            <div
              key={inv.id}
              className="flex justify-between items-center py-2 border-b border-slate-50 text-sm"
            >
              <div>
                <p className="font-bold">{inv.yearMonth}월</p>
                <p className="text-xs text-slate-400">
                  청구 {formatCurrency(inv.totalAmount)} · 미납{' '}
                  {formatCurrency(inv.unpaidAmount)}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${getInvoiceStatusBadge(inv.status).bg}`}
                >
                  {getInvoiceStatusBadge(inv.status).label}
                </span>
                {inv.receiptNumber && (
                  <p className="text-[10px] text-slate-400 mt-1">영수증 {inv.receiptNumber}</p>
                )}
              </div>
            </div>
          ))
        )}
      </Section>

      {showTextbooks && monthSales.length > 0 && (
        <Section title="교재비 상세">
          {monthSales.map((s) => (
            <div key={s.id} className="flex justify-between py-2 text-sm border-b border-slate-50">
              <div>
                <span className="font-medium">{s.textbookTitle}</span>
                <p className="text-[10px] text-slate-400">{s.saleDate}</p>
              </div>
              <span className={s.unpaidAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                {s.unpaidAmount > 0
                  ? `미납 ${formatCurrency(s.unpaidAmount)}`
                  : formatCurrency(s.paidAmount)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {payments.length > 0 && (
        <Section title="납부 영수증">
          {payments.slice(0, 12).map((p) => (
            <div key={p.id} className="py-2 text-sm border-b border-slate-50">
              <div className="flex justify-between">
                <span>{formatDate(p.paymentDate)}</span>
                <span className="font-bold">{formatCurrency(p.amount)}</span>
              </div>
              {p.receiptNumber && <p className="text-xs text-slate-400">No. {p.receiptNumber}</p>}
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}
