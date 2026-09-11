import React from 'react';
import { Student } from '@/types';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { Modal } from '@/shared/components/ui/Modal';
import { formatCurrency } from '@/utils/formatters';

interface TuitionNewInvoiceModalProps {
  customerLabel: string;
  students: Student[];
  studentId: string;
  onStudentIdChange: (id: string) => void;
  amount: number;
  onAmountChange: (amount: number) => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
  dueDate: string;
  onDueDateChange: (date: string) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  includeExtras: boolean;
  onIncludeExtrasChange: (value: boolean) => void;
  textbookFeePreview: number;
  textbookCountPreview: number;
  recitalFeePreview: number;
  recitalLabelPreview: string;
  extraFee: number;
  onExtraFeeChange: (amount: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const TuitionNewInvoiceModal: React.FC<TuitionNewInvoiceModalProps> = ({
  customerLabel,
  students,
  studentId,
  onStudentIdChange,
  amount,
  onAmountChange,
  discount,
  onDiscountChange,
  dueDate,
  onDueDateChange,
  notes,
  onNotesChange,
  includeExtras,
  onIncludeExtrasChange,
  textbookFeePreview,
  textbookCountPreview,
  recitalFeePreview,
  recitalLabelPreview,
  extraFee,
  onExtraFeeChange,
  onSubmit,
  onClose,
}) => {
  const total = Math.max(
    0,
    Number(amount) -
      Number(discount) +
      (includeExtras ? textbookFeePreview + recitalFeePreview : 0) +
      Number(extraFee)
  );

  return (
    <Modal isOpen onClose={onClose} title="개별 수강료 청구서 초안" maxWidth="md">
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">대상 {customerLabel}</label>
          <select
            value={studentId}
            onChange={(e) => onStudentIdChange(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
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
            <CurrencyInput value={amount} onChange={onAmountChange} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">할인/감면액 (₩)</label>
            <CurrencyInput value={discount} onChange={onDiscountChange} />
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 cursor-pointer min-h-[52px]">
          <input
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600"
            checked={includeExtras}
            onChange={(e) => onIncludeExtrasChange(e.target.checked)}
          />
          <span>
            <span className="block text-xs font-bold text-slate-800">교재·연주회비 합산</span>
            <span className="block text-[11px] text-slate-500 mt-0.5">
              미납 교재와 이번 달 연주회 참가비를 이 청구서에 포함합니다.
            </span>
          </span>
        </label>

        {includeExtras && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[11px] space-y-1">
            <p className="font-bold text-slate-700">합산 미리보기</p>
            <p className="text-slate-600">
              교재 {textbookCountPreview}건 · {formatCurrency(textbookFeePreview)}
            </p>
            <p className="text-slate-600">
              연주회·콩쿠르 · {formatCurrency(recitalFeePreview)}
              {recitalLabelPreview ? ` (${recitalLabelPreview})` : ''}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            기타(수동) · 발표회비 등 (₩)
          </label>
          <CurrencyInput value={extraFee} onChange={onExtraFeeChange} />
        </div>

        <div className="rounded-xl bg-indigo-600 text-white px-3.5 py-2.5 flex items-center justify-between">
          <span className="text-xs font-semibold">청구 합계</span>
          <span className="text-base font-black tabular-nums">{formatCurrency(total)}</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">납부 기한</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">비고 / 메모</label>
          <input
            type="text"
            placeholder="예: 형제 할인 10,000원 적용"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl min-h-[44px]"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md min-h-[44px]"
          >
            초안 저장
          </button>
        </div>
      </form>
    </Modal>
  );
};
