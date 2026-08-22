import React from 'react';
import { Student } from '@/types';
import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatters';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface TuitionCombinedBillingViewProps {
  students: Student[];
  searchQuery: string;
  onSelectStudent: (studentId: string) => void;
  onCombinedPay: (student: Student) => void;
}

export const TuitionCombinedBillingView: React.FC<TuitionCombinedBillingViewProps> = ({
  students,
  searchQuery,
  onSelectStudent,
  onCombinedPay
}) => (
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
                      onClick={() => onSelectStudent(student.id)}
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
                          onClick={() => onCombinedPay(student)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                        >
                          통합 수납
                        </button>
                      )}
                      <button
                        onClick={() => onSelectStudent(student.id)}
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
);
