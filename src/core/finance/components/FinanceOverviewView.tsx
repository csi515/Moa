import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatters';
import {
  getExpenseCategories,
  getIncomeCategories,
  getRecentYearMonths,
} from '@/core/finance/categories';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  DollarSign,
  ArrowRight,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export const FinanceOverviewView: React.FC = () => {
  const { setActiveTab } = useApp();
  const { industry } = usePermissions();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const monthOptions = getRecentYearMonths(12);

  const summary = useMemo(
    () => StorageService.getFinanceSummary(industry),
    [industry]
  );

  const monthDetail = useMemo(() => {
    const trend = summary.monthlyTrend.find((t) => t.yearMonth === selectedMonth);
    const incomeEntries = StorageService.getIncomeEntries().filter((e) =>
      e.date.startsWith(selectedMonth)
    );
    const expenses = StorageService.getExpenses().filter((e) =>
      e.date.startsWith(selectedMonth)
    );
    return {
      trend,
      incomeCount: incomeEntries.length,
      expenseCount: expenses.length,
    };
  }, [selectedMonth, summary.monthlyTrend]);

  const isPiano = industry === 'piano';

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          재무 요약
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          수입과 지출을 한눈에 확인하고 손익을 관리합니다. (원장 전용)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveTab('income')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-left hover:border-emerald-200 transition-colors"
        >
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-bold">이번 달 수입</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {formatCurrency(summary.totalIncomeThisMonth)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            직접 등록 {formatCurrency(summary.manualIncomeThisMonth)}
            {isPiano && ` · 연동 ${formatCurrency(summary.linkedIncomeThisMonth)}`}
          </p>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs text-left hover:border-rose-200 transition-colors"
        >
          <div className="flex items-center gap-2 text-rose-600 mb-2">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-bold">이번 달 지출</span>
          </div>
          <p className="text-2xl font-black text-rose-600">
            {formatCurrency(summary.totalExpenseThisMonth)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">운영비·인건비 등</p>
        </button>

        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-5 text-white shadow-md">
          <div className="flex items-center gap-2 text-indigo-200 mb-2">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold">이번 달 순수익</span>
          </div>
          <p className="text-2xl font-black">
            {formatCurrency(summary.netProfitThisMonth)}
          </p>
          <p className="text-[11px] text-indigo-200 mt-1">수입 − 지출</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h4 className="font-bold text-slate-900 text-sm">월별 수입·지출 추이</h4>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {summary.monthlyTrend.some((t) => t.income > 0 || t.expense > 0) ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name="수입" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="지출" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-12">
            아직 재무 데이터가 없습니다. 수입·지출을 등록해 보세요.
          </p>
        )}

        {monthDetail.trend && (
          <p className="text-xs text-slate-500 mt-3 text-center">
            {selectedMonth} — 수입 {monthDetail.incomeCount}건 · 지출 {monthDetail.expenseCount}건 ·
            순수익 {formatCurrency(monthDetail.trend.net)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab('income')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:bg-emerald-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900">수입 관리</p>
              <p className="text-xs text-slate-500">수입 등록·조회</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:bg-rose-50/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-slate-900">지출 관리</p>
              <p className="text-xs text-slate-500">지출 등록·조회</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {isPiano && (
        <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100">
          <p className="text-xs text-indigo-800 leading-relaxed">
            피아노 학원의 수강료·교재 매출은 각 메뉴에서 관리되며, 재무 요약에 자동 반영됩니다.
            수입 관리에서는 기타 수입(대관, 부대사업 등)을 직접 등록할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};
