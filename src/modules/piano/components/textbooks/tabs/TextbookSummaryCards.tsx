import React from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { TextbookStats } from '../textbookViewTypes';

interface TextbookSummaryCardsProps {
  stats: TextbookStats;
  currentYM: string;
  onLowStockClick: () => void;
}

export const TextbookSummaryCards: React.FC<TextbookSummaryCardsProps> = ({
  stats,
  currentYM,
  onLowStockClick
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {/* Card 1: 이번달 판매액 */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">이번달 교재 판매액</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <p className="text-lg sm:text-xl font-bold text-slate-900">
          ₩{stats.monthlySaleAmount.toLocaleString()}
        </p>
        <p className="text-[11px] text-slate-400 mt-1">{currentYM}월 누적 총 판매</p>
      </div>

      {/* Card 2: 이번달 수납액 */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">이번달 교재비 수납액</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <p className="text-lg sm:text-xl font-bold text-emerald-600">
          ₩{stats.monthlyPaidAmount.toLocaleString()}
        </p>
        <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">
          수납률 {stats.monthlySaleAmount > 0 ? Math.round((stats.monthlyPaidAmount / stats.monthlySaleAmount) * 100) : 100}%
        </p>
      </div>

      {/* Card 3: 미납 잔액 */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">전체 교재비 미납액</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <p className="text-lg sm:text-xl font-bold text-rose-600">
          ₩{stats.totalUnpaidAmount.toLocaleString()}
        </p>
        <p className="text-[11px] text-rose-600/80 mt-1 font-medium">
          미납 원생 {stats.unpaidStudentsCount}명
        </p>
      </div>

      {/* Card 4: 판매 권수 */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">이번달 판매 권수</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4" />
          </div>
        </div>
        <p className="text-lg sm:text-xl font-bold text-slate-900">
          {stats.monthlyBooksSold}권
        </p>
        <p className="text-[11px] text-slate-400 mt-1">원생 출고 완료</p>
      </div>

      {/* Card 5: 재고 부족 알림 */}
      <div
        onClick={onLowStockClick}
        className={`p-4 bg-white rounded-2xl border cursor-pointer transition-all ${
          stats.lowStockBooksCount > 0
            ? 'border-amber-300 bg-amber-50/20 hover:bg-amber-50/40'
            : 'border-slate-200 hover:bg-slate-50'
        } shadow-xs col-span-2 lg:col-span-1`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">재고 부족 교재</span>
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              stats.lowStockBooksCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <p className={`text-lg sm:text-xl font-bold ${stats.lowStockBooksCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
          {stats.lowStockBooksCount}종
        </p>
        <p className="text-[11px] text-amber-600 font-medium mt-1">
          {stats.lowStockBooksCount > 0 ? '클릭하여 발주 대상 확인' : '재고 상태 양호'}
        </p>
      </div>
    </div>
  );
};
