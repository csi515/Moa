import React from 'react';
import { formatCurrency } from '@/utils/formatters';
import { TuitionStats } from './tuitionViewTypes';

interface TuitionSummaryCardsProps {
  selectedMonth: string;
  stats: TuitionStats;
}

export const TuitionSummaryCards: React.FC<TuitionSummaryCardsProps> = ({
  selectedMonth,
  stats
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
      <p className="text-xs font-semibold text-slate-500">총 청구액 ({selectedMonth})</p>
      <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
        {formatCurrency(stats.totalBilled)}
      </p>
      <p className="text-[11px] text-slate-400 mt-1">발행 청구서 {stats.totalCount}건</p>
    </div>

    <div className="bg-emerald-50/80 p-5 rounded-3xl border border-emerald-200 shadow-xs">
      <p className="text-xs font-bold text-emerald-800">수납 완료액</p>
      <p className="text-xl sm:text-2xl font-black text-emerald-900 mt-1">
        {formatCurrency(stats.totalPaid)}
      </p>
      <p className="text-[11px] text-emerald-700 font-semibold mt-1">수납률 {stats.collectionRate}%</p>
    </div>

    <div className="bg-rose-50/80 p-5 rounded-3xl border border-rose-200 shadow-xs">
      <p className="text-xs font-bold text-rose-800">미납 수강료</p>
      <p className="text-xl sm:text-2xl font-black text-rose-900 mt-1">
        {formatCurrency(stats.totalUnpaid)}
      </p>
      <p className="text-[11px] text-rose-700 font-semibold mt-1">미납 {stats.unpaidCount}건</p>
    </div>

    <div className="bg-indigo-50/80 p-5 rounded-3xl border border-indigo-200 shadow-xs">
      <p className="text-xs font-bold text-indigo-800">수납 진행률</p>
      <div className="w-full bg-indigo-200 h-3 rounded-full overflow-hidden mt-2">
        <div
          className="bg-indigo-600 h-full rounded-full transition-all"
          style={{ width: `${stats.collectionRate}%` }}
        />
      </div>
      <p className="text-[11px] text-indigo-700 font-bold text-right mt-1">{stats.collectionRate}% 완료</p>
    </div>
  </div>
);
