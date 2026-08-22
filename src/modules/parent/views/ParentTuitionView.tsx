import React from 'react';
import { StorageService } from '@/services/storage';
import {
  formatCurrency,
  formatDate,
  getInvoiceStatusBadge,
} from '@/utils/formatters';
import type { Student } from '@/types';
import { Section } from './shared';

export function ParentTuitionView({ student }: { student: Student }) {
  const summary = StorageService.getStudentBillingSummary(student.id);
  const invoices = StorageService.getInvoices().filter((i) => i.studentId === student.id);
  const sales = StorageService.getTextbookSalesByStudentId(student.id);
  const payments = StorageService.getTextbookPayments().filter((p) => p.studentId === student.id);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500">통합 미납</p>
        <p className={`text-2xl font-black ${(summary.grandUnpaid ?? summary.totalUnpaid) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {formatCurrency(summary.grandUnpaid ?? summary.totalUnpaid)}
        </p>
      </div>

      <Section title="수강료 청구·수납">
        {invoices.slice(0, 12).map((inv) => (
          <div key={inv.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
            <div>
              <p className="font-bold">{inv.yearMonth}월</p>
              <p className="text-xs text-slate-400">{formatCurrency(inv.totalAmount)}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${getInvoiceStatusBadge(inv.status).bg}`}>
                {getInvoiceStatusBadge(inv.status).label}
              </span>
              {inv.receiptNumber && (
                <p className="text-[10px] text-slate-400 mt-1">영수증 {inv.receiptNumber}</p>
              )}
            </div>
          </div>
        ))}
      </Section>

      {sales.length > 0 && (
        <Section title="교재비">
          {sales.map((s) => (
            <div key={s.id} className="flex justify-between py-2 text-sm border-b border-slate-50">
              <span>{s.textbookTitle}</span>
              <span className={s.unpaidAmount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                {formatCurrency(s.unpaidAmount > 0 ? s.unpaidAmount : s.paidAmount)}
              </span>
            </div>
          ))}
        </Section>
      )}

      {payments.length > 0 && (
        <Section title="납부 영수증">
          {payments.map((p) => (
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
