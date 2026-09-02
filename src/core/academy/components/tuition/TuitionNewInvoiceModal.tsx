import React from 'react';
import { Student } from '@/types';
import { X } from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

interface TuitionNewInvoiceModalProps {
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
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const TuitionNewInvoiceModal: React.FC<TuitionNewInvoiceModalProps> = ({
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
  onSubmit,
  onClose
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-base">개별 수강료 청구서 발행</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">대상 원생</label>
          <select
            value={studentId}
            onChange={(e) => onStudentIdChange(e.target.value)}
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
              value={amount}
              onChange={onAmountChange}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">할인/감면액 (₩)</label>
            <CurrencyInput
              value={discount}
              onChange={onDiscountChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">납부 기한</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">비고 / 메모</label>
          <input
            type="text"
            placeholder="예: 형제 할인 10,000원 적용"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
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
);
