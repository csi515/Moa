import React from 'react';
import { ChevronRight, Users } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import {
  formatPayrollFormula,
  payTypeLabel,
  quantityUnitLabel,
  type TeacherPayrollRow,
} from '@/core/finance/teacherPayroll';
import { TeacherPayrollStatusBadge } from './TeacherPayrollStatusBadge';

interface TeacherPayrollListProps {
  rows: TeacherPayrollRow[];
  onOpenDetail: (row: TeacherPayrollRow) => void;
}

export function TeacherPayrollList({ rows, onOpenDetail }: TeacherPayrollListProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
        등록된 활성 강사가 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="text-left font-bold px-4 py-3">강사</th>
              <th className="text-left font-bold px-3 py-3">정산 방식</th>
              <th className="text-left font-bold px-3 py-3">정산 실적</th>
              <th className="text-right font-bold px-3 py-3">계산 금액</th>
              <th className="text-right font-bold px-3 py-3">최종 금액</th>
              <th className="text-center font-bold px-3 py-3">상태</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.teacherId} className="border-t border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3 font-bold text-slate-900">{row.teacherName}</td>
                <td className="px-3 py-3 text-slate-600">{payTypeLabel(row.payType)}</td>
                <td className="px-3 py-3 text-slate-700">
                  {formatPayrollFormula({
                    payType: row.payType,
                    quantity: row.quantity,
                    rate: row.rate,
                  })}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {formatCurrency(row.calculatedAmount)}
                </td>
                <td className="px-3 py-3 text-right font-black tabular-nums text-slate-900">
                  {formatCurrency(row.finalAmount)}
                </td>
                <td className="px-3 py-3 text-center">
                  <TeacherPayrollStatusBadge status={row.settlementStatus} />
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(row)}
                    className="text-indigo-600 font-bold hover:underline min-h-[44px] px-2"
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((row) => (
          <button
            key={row.teacherId}
            type="button"
            onClick={() => onOpenDetail(row)}
            className="w-full text-left bg-white rounded-2xl border border-slate-200 p-4 space-y-2 min-h-[44px]"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900 text-sm">{row.teacherName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {payTypeLabel(row.payType)}
                  {row.payType !== 'none' && row.payType !== 'monthly'
                    ? ` · ${row.quantity}${quantityUnitLabel(row.payType)}`
                    : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TeacherPayrollStatusBadge status={row.settlementStatus} />
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                {formatPayrollFormula({
                  payType: row.payType,
                  quantity: row.quantity,
                  rate: row.rate,
                })}
              </span>
              <span className="font-black text-slate-900 tabular-nums">
                {formatCurrency(row.finalAmount)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
