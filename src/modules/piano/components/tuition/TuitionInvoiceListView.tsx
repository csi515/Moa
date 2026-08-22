import React from 'react';
import { Student, TuitionInvoice } from '@/types';
import { formatCurrency, getInvoiceStatusBadge } from '@/utils/formatters';
import { FileText } from 'lucide-react';

interface TuitionInvoiceListViewProps {
  filteredInvoices: TuitionInvoice[];
  students: Student[];
  onSelectStudent: (studentId: string) => void;
  onOpenPayModal: (invoice: TuitionInvoice) => void;
  onOpenReceipt: (invoice: TuitionInvoice) => void;
}

export const TuitionInvoiceListView: React.FC<TuitionInvoiceListViewProps> = ({
  filteredInvoices,
  students,
  onSelectStudent,
  onOpenPayModal,
  onOpenReceipt
}) => (
  <div className="space-y-3">
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
                        onClick={() => onSelectStudent(inv.studentId)}
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
                            onClick={() => onOpenPayModal(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                          >
                            수납 결제
                          </button>
                        ) : (
                          <button
                            onClick={() => onOpenReceipt(inv)}
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
                      onClick={() => onSelectStudent(inv.studentId)}
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
                      onClick={() => onOpenPayModal(inv)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-2xs cursor-pointer"
                    >
                      수납 결제
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenReceipt(inv)}
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
);
