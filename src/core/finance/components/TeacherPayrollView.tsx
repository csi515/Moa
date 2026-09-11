import React from 'react';
import { Wallet } from 'lucide-react';
import { formatPayrollPeriod, resolveEditableQuantity } from '@/core/finance/teacherPayroll';
import { PageHeader } from '@/shared/components';
import { TeacherPayrollDetailModal } from './TeacherPayrollDetailModal';
import { TeacherPayrollList } from './TeacherPayrollList';
import { TeacherPayrollSummaryCards } from './TeacherPayrollSummaryCards';
import { useTeacherPayroll } from './useTeacherPayroll';

export const TeacherPayrollView: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const payroll = useTeacherPayroll();
  const selected = payroll.selectedRow;

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-4 pb-4'}>
      {!embedded && (
        <PageHeader
          icon={<Wallet className="w-6 h-6" />}
          title="강사 정산"
          description="강사별 지급 기준과 실적으로 정산 금액을 확인하고 확정합니다"
        />
      )}

      {embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900">강사 정산</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              레슨·출근·근무시간·월급 기준으로 계산 후 정산 확정 → 지출 등록
            </p>
          </div>
          <button
            type="button"
            onClick={() => payroll.setActiveTab('teachers')}
            className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] self-start"
          >
            강사 정산 기준 설정
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={payroll.selectedMonth}
          onChange={(e) => payroll.changeMonth(e.target.value)}
          className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl min-h-[44px]"
        >
          {payroll.monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 font-medium">
          기간 {formatPayrollPeriod(payroll.selectedMonth)}
        </p>
      </div>

      <TeacherPayrollSummaryCards totals={payroll.totals} />
      <TeacherPayrollList rows={payroll.rows} onOpenDetail={payroll.openDetail} />

      <p className="text-[11px] text-slate-400 leading-relaxed">
        레슨 실적은 「오늘 레슨」 기록 기준입니다. 출근·근무시간 방식은 자동 집계가 없어 정산
        상세에서 실적을 직접 입력해야 하며, 미입력 시 0원으로 표시됩니다. 정산 확정과 지출 등록은
        분리되어 있으며, 이미 지출 등록된 월은 중복 등록되지 않습니다. 정산 확정 기록은 이
        기기에만 저장됩니다(클라우드 미동기화).
      </p>

      {selected && (
        <TeacherPayrollDetailModal
          row={selected}
          yearMonth={payroll.selectedMonth}
          draftQuantity={resolveEditableQuantity(
            selected,
            payroll.quantityOverrides[selected.teacherId]
          )}
          draftAdjustment={payroll.adjustmentOverrides[selected.teacherId]?.amount || 0}
          draftReason={payroll.adjustmentOverrides[selected.teacherId]?.reason || ''}
          onQuantityChange={(v) => payroll.setDraftQuantity(selected.teacherId, v)}
          onAdjustmentChange={(v) => payroll.setDraftAdjustment(selected.teacherId, v)}
          onReasonChange={(v) => payroll.setDraftReason(selected.teacherId, v)}
          onConfirm={() => payroll.handleConfirm(selected)}
          onRegisterExpense={() => payroll.handleRegisterExpense(selected)}
          onClose={payroll.closeDetail}
        />
      )}
    </div>
  );
};
