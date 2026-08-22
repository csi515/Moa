import React from 'react';
import { CreditCard, Search, Users } from 'lucide-react';
import { ViewMode } from './tuitionViewTypes';

interface TuitionFilterBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedMonth: string;
  onSelectedMonthChange: (month: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filteredInvoicesCount: number;
  studentsCount: number;
}

export const TuitionFilterBar: React.FC<TuitionFilterBarProps> = ({
  viewMode,
  onViewModeChange,
  selectedMonth,
  onSelectedMonthChange,
  statusFilter,
  onStatusFilterChange,
  searchQuery,
  onSearchQueryChange,
  filteredInvoicesCount,
  studentsCount
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
      <button
        onClick={() => onViewModeChange('invoices')}
        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
          viewMode === 'invoices'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
        }`}
      >
        <CreditCard className="w-4 h-4" />
        수강료 개별 청구서 목록 ({filteredInvoicesCount})
      </button>
      <button
        onClick={() => onViewModeChange('combined')}
        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
          viewMode === 'combined'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
        }`}
      >
        <Users className="w-4 h-4" />
        원생별 월간 통합 청구 및 수납 (수강료 + 교재비)
      </button>
    </div>

    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          value={selectedMonth}
          onChange={(e) => onSelectedMonthChange(e.target.value)}
          className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
        >
          <option value="2025-08">2025년 8월</option>
          <option value="2025-07">2025년 7월</option>
          <option value="2025-06">2025년 6월</option>
          <option value="2025-05">2025년 5월</option>
        </select>

        {viewMode === 'invoices' && (
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
          >
            <option value="ALL">전체 상태</option>
            <option value="paid">수납 완료</option>
            <option value="unpaid">미납</option>
            <option value="overdue">연체/기한초과</option>
          </select>
        )}

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="원생 이름 검색..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <span className="text-xs text-slate-500 font-medium">
        {viewMode === 'invoices' ? (
          <>조회 결과: <strong className="text-slate-900">{filteredInvoicesCount}건</strong></>
        ) : (
          <>재원생: <strong className="text-slate-900">{studentsCount}명</strong></>
        )}
      </span>
    </div>
  </div>
);
