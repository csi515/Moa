import React from 'react';
import { Boxes, ShoppingBag, CreditCard, History } from 'lucide-react';
import { SubTab } from '../textbookViewTypes';

interface TextbookSubTabNavProps {
  activeSubTab: SubTab;
  onSubTabChange: (tab: SubTab) => void;
  textbooksCount: number;
  salesCount: number;
  transactionsCount: number;
}

export const TextbookSubTabNav: React.FC<TextbookSubTabNavProps> = ({
  activeSubTab,
  onSubTabChange,
  textbooksCount,
  salesCount,
  transactionsCount
}) => {
  return (
    <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
      <button
        onClick={() => onSubTabChange('inventory')}
        className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
          activeSubTab === 'inventory'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
      >
        <Boxes className="w-4 h-4" />
        교재 목록 및 재고 관리 ({textbooksCount})
      </button>

      <button
        onClick={() => onSubTabChange('sales')}
        className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
          activeSubTab === 'sales'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
      >
        <ShoppingBag className="w-4 h-4" />
        교재 판매 내역 ({salesCount})
      </button>

      <button
        onClick={() => onSubTabChange('payments')}
        className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
          activeSubTab === 'payments'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
      >
        <CreditCard className="w-4 h-4" />
        교재비 수납 / 분할 납부
      </button>

      <button
        onClick={() => onSubTabChange('history')}
        className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
          activeSubTab === 'history'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
      >
        <History className="w-4 h-4" />
        입출고 및 재고 변동 이력 ({transactionsCount})
      </button>
    </div>
  );
};
