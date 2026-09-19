import { useState, type FC } from 'react';
import { AlertCircle, Share2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { TuitionService } from '@/core/finance';
import { shareInvoiceNotice } from '@/core/finance/invoiceShare';
import { formatCurrency } from '@/utils/formatters';
import type { TuitionInvoice } from '@/types';
import { DirectorSectionEmpty } from './DirectorSectionEmpty';

interface DirectorTodayUnpaidSectionProps {
  invoices: TuitionInvoice[];
  onOpenUnpaid?: () => void;
}

/** 원장 홈 — 이번 달 미납 + 청구서 Web Share (목록은 부모 훅에서 전달) */
export const DirectorTodayUnpaidSection: FC<DirectorTodayUnpaidSectionProps> = ({
  invoices,
  onOpenUnpaid,
}) => {
  const { showToast, triggerRefresh } = useApp();
  const [busyId, setBusyId] = useState<string | null>(null);

  const total = invoices.reduce((sum, inv) => sum + (inv.unpaidAmount || 0), 0);

  const handleSend = async (inv: TuitionInvoice) => {
    setBusyId(inv.id);
    try {
      TuitionService.sendInvoice(inv.id);
      const result = await shareInvoiceNotice({
        studentName: inv.studentName,
        amount: inv.unpaidAmount,
        yearMonth: inv.yearMonth,
        title: inv.title,
      });
      if (result === 'shared') {
        showToast('청구서를 공유했습니다.', 'success');
      } else if (result === 'copied') {
        showToast('청구서 문구를 복사했습니다. 카톡에 붙여넣어 주세요.', 'info');
      } else {
        showToast('청구서 발송 처리되었습니다. 이 기기에서는 공유를 지원하지 않습니다.', 'warning');
      }
      triggerRefresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '청구서 전송 실패', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            이번 달 미납
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {invoices.length}명 · {formatCurrency(total)}
          </p>
        </div>
        {onOpenUnpaid && (
          <button
            type="button"
            onClick={onOpenUnpaid}
            className="text-xs font-bold text-indigo-600 min-h-[44px] px-1"
          >
            전체
          </button>
        )}
      </div>

      {invoices.length === 0 ? (
        <DirectorSectionEmpty className="py-6">미납 청구서가 없습니다.</DirectorSectionEmpty>
      ) : (
        <ul className="space-y-2 max-h-[240px] overflow-y-auto">
          {invoices.slice(0, 8).map((inv) => (
            <li
              key={inv.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2.5 rounded-xl border border-rose-100 bg-rose-50/50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{inv.studentName}</p>
                <p className="text-[11px] text-rose-700 font-bold tabular-nums mt-0.5">
                  {formatCurrency(inv.unpaidAmount)}
                  <span className="text-slate-500 font-medium"> · {inv.yearMonth}</span>
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === inv.id}
                onClick={() => void handleSend(inv)}
                className="shrink-0 min-h-[48px] px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                청구서 전송
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
