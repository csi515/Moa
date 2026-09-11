import React, { useMemo, useState } from 'react';
import { Student } from '@/types';
import { formatCurrency } from '@/utils/formatters';
import { filterMonthlyBillingStudents } from '@/core/academy/utils/billingMode';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { Modal } from '@/shared/components/ui/Modal';

interface TuitionBulkSendModalProps {
  customerLabel: string;
  students: Student[];
  yearMonth: string;
  defaultAmount: number;
  defaultDueDate: string;
  onSubmit: (payload: {
    studentIds: string[];
    title: string;
    amount: number;
    dueDate: string;
    notes?: string;
  }) => void;
  onClose: () => void;
}

/** 일괄 청구 발송 — shared Modal */
export const TuitionBulkSendModal: React.FC<TuitionBulkSendModalProps> = ({
  customerLabel,
  students,
  yearMonth,
  defaultAmount,
  defaultDueDate,
  onSubmit,
  onClose,
}) => {
  const eligible = useMemo(
    () => filterMonthlyBillingStudents(students, { activeOnly: true }),
    [students]
  );
  const [selectedIds, setSelectedIds] = useState<string[]>(() => eligible.map((s) => s.id));
  const [title, setTitle] = useState(`${yearMonth} 수강료`);
  const [amount, setAmount] = useState(defaultAmount);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [notes, setNotes] = useState('');

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === eligible.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligible.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      studentIds: selectedIds,
      title: title.trim() || `${yearMonth} 수강료`,
      amount,
      dueDate,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Modal isOpen onClose={onClose} title="일괄 청구서 발송" maxWidth="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <p className="text-xs text-slate-500 -mt-2">
          선택 {customerLabel}에게만 청구서를 생성·발송합니다. (자동 발송 없음)
        </p>

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700">
            대상 {customerLabel} ({selectedIds.length}/{eligible.length})
          </p>
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-bold text-indigo-600 min-h-[44px] px-2"
          >
            {selectedIds.length === eligible.length ? '전체 해제' : '전체 선택'}
          </button>
        </div>

        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
          {eligible.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">월회비 대상 재원 {customerLabel}이(가) 없습니다.</p>
          ) : (
            eligible.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                  checked={selectedIds.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span className="text-xs font-bold text-slate-800 flex-1">{s.name}</span>
                <span className="text-[11px] text-slate-500 tabular-nums">
                  {formatCurrency(s.tuitionFee || defaultAmount)}
                </span>
              </label>
            ))
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">청구서 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">청구 금액 (₩)</label>
            <CurrencyInput value={amount} onChange={setAmount} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">납부 기한</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">비고 (선택)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="예: 현장 카드·상품권 결제 가능"
            className="w-full px-3 py-2.5 min-h-[44px] text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={selectedIds.length === 0 || amount <= 0}
            className="px-5 py-2.5 min-h-[44px] text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md"
          >
            {selectedIds.length}명 청구서 발송
          </button>
        </div>
      </form>
    </Modal>
  );
};
