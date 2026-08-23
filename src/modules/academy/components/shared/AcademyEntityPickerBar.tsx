import React from 'react';
import { FilterBar } from '@/shared/components';
import { Trash2 } from 'lucide-react';

interface EntityOption {
  id: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (id: string) => void;
  options: EntityOption[];
  emptyLabel: string;
  onDelete?: () => void;
  deleteAriaLabel?: string;
}

/** 숙제·시험 등 배치 기록 선택 + 삭제 */
export const AcademyEntityPickerBar: React.FC<Props> = ({
  value,
  onChange,
  options,
  emptyLabel,
  onDelete,
  deleteAriaLabel = '삭제',
}) => (
  <FilterBar>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 px-4 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold"
    >
      {options.length === 0 && <option value="">{emptyLabel}</option>}
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
    {onDelete && value && (
      <button
        type="button"
        onClick={onDelete}
        className="px-3 py-2 min-h-[44px] min-w-[44px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center"
        aria-label={deleteAriaLabel}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </FilterBar>
);
