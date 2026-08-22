import React, { useState, useMemo } from 'react';
import { TextbookInventoryTransaction } from '@/types';
import { HistoryFilterType } from '../textbookViewTypes';

interface TextbookHistoryTabProps {
  transactions: TextbookInventoryTransaction[];
}

export const TextbookHistoryTab: React.FC<TextbookHistoryTabProps> = ({ transactions }) => {
  const [historyFilterType, setHistoryFilterType] = useState<HistoryFilterType>('all');

  const filteredTransactions = useMemo(
    () => transactions.filter((tx) => historyFilterType === 'all' || tx.transactionType === historyFilterType),
    [transactions, historyFilterType]
  );

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-700">변동 유형 필터:</span>
          <div className="flex gap-1">
            {(['all', 'inbound', 'sale', 'adjust', 'return'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setHistoryFilterType(t)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  historyFilterType === t
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t === 'all'
                  ? '전체'
                  : t === 'inbound'
                  ? '입고'
                  : t === 'sale'
                  ? '판매출고'
                  : t === 'adjust'
                  ? '수동조정'
                  : '반품/취소'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">일자</th>
                <th className="py-3 px-4">교재명</th>
                <th className="py-3 px-3 text-center">구분</th>
                <th className="py-3 px-3 text-center">변동수량</th>
                <th className="py-3 px-3 text-center">변동 전 재고</th>
                <th className="py-3 px-3 text-center font-bold">변동 후 재고</th>
                <th className="py-3 px-4">사유 및 상세 내역</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => {
                const typeBadge =
                  tx.transactionType === 'inbound' ? (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                      신규입고
                    </span>
                  ) : tx.transactionType === 'sale' ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                      판매출고
                    </span>
                  ) : tx.transactionType === 'return' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                      반품입고
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                      재고조정
                    </span>
                  );

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-slate-500 font-medium">{tx.transactionDate}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{tx.textbookTitle}</td>
                    <td className="py-3 px-3 text-center">{typeBadge}</td>
                    <td className="py-3 px-3 text-center font-bold">
                      <span className={tx.quantity > 0 ? 'text-indigo-600' : 'text-rose-600'}>
                        {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}권
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">{tx.previousStock}권</td>
                    <td className="py-3 px-3 text-center font-black text-slate-900">{tx.currentStock}권</td>
                    <td className="py-3 px-4 text-slate-600">{tx.memo || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
