import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import {
  formatPayRateDisplay,
  formatPayrollFormula,
  formatPayrollPeriod,
  payTypeLabel,
  quantityUnitLabel,
  resolveDraftCalculated,
  settlementStatusLabel,
  type TeacherPayrollRow,
} from '@/core/finance/teacherPayroll';
import { Modal } from '@/shared/components/ui';

interface TeacherPayrollDetailProps {
  row: TeacherPayrollRow;
  yearMonth: string;
  draftQuantity: number;
  draftAdjustment: number;
  draftReason: string;
  onQuantityChange: (v: number) => void;
  onAdjustmentChange: (v: number) => void;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onRegisterExpense: () => void;
  onClose: () => void;
}

export const TeacherPayrollDetailModal: React.FC<TeacherPayrollDetailProps> = ({
  row,
  yearMonth,
  draftQuantity,
  draftAdjustment,
  draftReason,
  onQuantityChange,
  onAdjustmentChange,
  onReasonChange,
  onConfirm,
  onRegisterExpense,
  onClose,
}) => {
  const locked = row.settlementStatus !== 'pending';
  const calculated = locked
    ? row.calculatedAmount
    : resolveDraftCalculated(row, draftQuantity);
  const finalAmount = locked ? row.finalAmount : Math.max(0, calculated + draftAdjustment);
  const formulaQuantity = locked
    ? row.quantity
    : row.payType === 'monthly'
      ? 1
      : draftQuantity;

  return (
    <Modal isOpen onClose={onClose} title={`${row.teacherName} 정산`} maxWidth="md">
      <div className="space-y-4 p-4 sm:p-6">
        <DetailRow label="정산 대상 기간" value={formatPayrollPeriod(yearMonth)} />
        <DetailRow label="정산 방식" value={payTypeLabel(row.payType)} />

        {row.payType === 'hourly' && (
          <DetailRow
            label="레슨 실적"
            value={`${locked ? row.quantity : row.lessonCount}회`}
            hint="「오늘 레슨」에 저장된 레슨 기록 기준"
          />
        )}

        {row.requiresManualQuantity && !locked && (
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              정산 대상 {row.payType === 'attendance' ? '출근' : '근무 시간'} (
              {quantityUnitLabel(row.payType)})
            </label>
            <input
              type="number"
              min={0}
              step={row.payType === 'work_hours' ? 0.5 : 1}
              value={draftQuantity}
              onChange={(e) => onQuantityChange(Number(e.target.value) || 0)}
              className="w-full px-3 py-2.5 text-sm font-bold border border-slate-200 rounded-xl min-h-[44px]"
            />
            <p className="text-[11px] text-amber-700 mt-1.5 leading-relaxed">
              출근·근무시간은 출결/세션에서 자동 집계되지 않습니다. 값을 비우면 정산액이 0원으로
              계산되니, 이번 달 실적을 직접 입력한 뒤 확정하세요.
            </p>
          </div>
        )}

        {row.requiresManualQuantity && locked && (
          <DetailRow
            label={row.payType === 'attendance' ? '출근' : '근무 시간'}
            value={`${row.quantity}${quantityUnitLabel(row.payType)}`}
          />
        )}

        {row.payType !== 'none' && (
          <DetailRow label="지급 기준" value={formatPayRateDisplay(row.payType, row.rate)} />
        )}

        <DetailRow
          label="계산식"
          value={formatPayrollFormula({
            payType: row.payType,
            quantity: formulaQuantity,
            rate: row.rate,
          })}
        />
        <DetailRow label="계산 금액" value={formatCurrency(calculated)} />

        {!locked ? (
          <>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                조정 금액 (가감, 음수 가능)
              </label>
              <input
                type="number"
                step={1000}
                value={draftAdjustment}
                onChange={(e) => onAdjustmentChange(Number(e.target.value) || 0)}
                className="w-full px-3 py-2.5 text-sm font-bold border border-slate-200 rounded-xl min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">조정 사유</label>
              <input
                type="text"
                value={draftReason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="예: 보너스, 결근 차감 등"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              />
            </div>
          </>
        ) : (
          (row.adjustmentAmount !== 0 || row.adjustmentReason) && (
            <>
              <DetailRow
                label="조정 금액"
                value={`${row.adjustmentAmount > 0 ? '+' : ''}${formatCurrency(row.adjustmentAmount)}`}
              />
              {row.adjustmentReason ? (
                <DetailRow label="조정 사유" value={row.adjustmentReason} />
              ) : null}
            </>
          )
        )}

        <div className="rounded-xl bg-slate-900 text-white px-4 py-3">
          <p className="text-[11px] font-bold text-slate-300">최종 정산 금액</p>
          <p className="text-lg font-black tabular-nums mt-0.5">{formatCurrency(finalAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            상태: {settlementStatusLabel(row.settlementStatus)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {row.settlementStatus === 'pending' && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={finalAmount <= 0 || row.payType === 'none'}
              className="flex-1 min-h-[44px] px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl"
            >
              정산 확정
            </button>
          )}
          {row.settlementStatus === 'confirmed' && (
            <button
              type="button"
              onClick={onRegisterExpense}
              className="flex-1 min-h-[44px] px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
            >
              지출 등록
            </button>
          )}
          {row.settlementStatus === 'expensed' && (
            <p className="flex-1 text-xs text-emerald-700 font-bold flex items-center gap-1.5 justify-center min-h-[44px]">
              <CheckCircle2 className="w-4 h-4" />
              지출에 등록됨
            </p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl"
          >
            닫기
          </button>
        </div>
      </div>
    </Modal>
  );
};

function DetailRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div>
        <p className="text-[11px] font-bold text-slate-500">{label}</p>
        {hint ? <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p> : null}
      </div>
      <p className="font-bold text-slate-900 text-right">{value}</p>
    </div>
  );
}
