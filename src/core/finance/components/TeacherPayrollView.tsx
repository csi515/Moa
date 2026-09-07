import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { LessonService } from '@/core/lessons';
import { formatCurrency } from '@/utils/formatters';
import { getRecentYearMonths } from '@/core/finance/categories';
import {
  buildPayrollExpenseDraft,
  buildTeacherPayrollRows,
  type TeacherPayrollRow,
} from '@/core/finance/teacherPayroll';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { PageHeader } from '@/shared/components';
import { Users, CheckCircle2, Wallet } from 'lucide-react';

function payTypeLabel(payType: TeacherPayrollRow['payType']): string {
  if (payType === 'hourly') return '시급';
  if (payType === 'monthly') return '월급';
  return '미설정';
}

export const TeacherPayrollView: React.FC<{ embedded?: boolean }> = ({
  embedded = false,
}) => {
  const { showToast, openConfirmDialog, triggerRefresh, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const refreshKey = useStorageRefresh();
  const monthOptions = useMemo(() => getRecentYearMonths(12), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0]?.value || '');
  const [amountOverrides, setAmountOverrides] = useState<Record<string, number>>({});

  const teachers = useMemo(() => StorageService.getTeachers(), [refreshKey]);
  const lessons = useMemo(() => LessonService.getLessonRecords(), [refreshKey]);
  const expenses = useMemo(() => StorageService.getExpenses(), [refreshKey]);

  const rows = useMemo(
    () =>
      buildTeacherPayrollRows({
        teachers,
        lessons,
        expenses,
        yearMonth: selectedMonth,
      }),
    [teachers, lessons, expenses, selectedMonth]
  );

  const totals = useMemo(() => {
    const pending = rows.filter((r) => !r.settledExpenseId && r.amount > 0);
    const settled = rows.filter((r) => r.settledExpenseId);
    return {
      lessonCount: rows.reduce((s, r) => s + r.lessonCount, 0),
      pendingAmount: pending.reduce(
        (s, r) => s + (amountOverrides[r.teacherId] ?? r.amount),
        0
      ),
      pendingCount: pending.length,
      settledCount: settled.length,
      settledAmount: settled.reduce((s, r) => s + (r.settledAmount || 0), 0),
    };
  }, [rows, amountOverrides]);

  const resolveAmount = (row: TeacherPayrollRow) =>
    amountOverrides[row.teacherId] ?? row.amount;

  const handleSettle = (row: TeacherPayrollRow) => {
    const teacher = teachers.find((t) => t.id === row.teacherId);
    if (!teacher) return;

    const amount = resolveAmount(row);
    if (amount <= 0) {
      showToast('정산 금액이 0원입니다. 시급·월급을 강사 정보에 등록하세요.', 'warning');
      return;
    }
    if (row.settledExpenseId) {
      showToast('이미 해당 월 정산이 등록되어 있습니다.', 'info');
      return;
    }
    if (row.payType === 'none') {
      showToast('정산 방식이 미설정입니다. 강사 정보에서 시급 또는 월급을 설정하세요.', 'warning');
      return;
    }
    if (row.payType === 'hourly' && row.lessonCount === 0) {
      showToast('이번 달 레슨 기록이 없습니다. 레슨 저장 후 다시 시도하세요.', 'warning');
      return;
    }

    openConfirmDialog({
      title: '강사 정산 지출 등록',
      message: `${teacher.name} · ${selectedMonth}\n${formatCurrency(amount)}을(를) 지출(강사료/인건비)로 등록할까요?`,
      confirmText: '지출 등록',
      onConfirm: () => {
        const draft = buildPayrollExpenseDraft({
          teacher,
          yearMonth: selectedMonth,
          amount,
          lessonCount: row.lessonCount,
          payType: row.payType,
          industry,
        });
        StorageService.saveExpense(draft);
        setAmountOverrides((prev) => {
          const next = { ...prev };
          delete next[row.teacherId];
          return next;
        });
        triggerRefresh();
        showToast(`${teacher.name} 정산이 지출로 등록되었습니다.`, 'success');
      },
    });
  };

  return (
    <div className={embedded ? 'space-y-4' : 'space-y-4 pb-4'}>
      {!embedded && (
        <PageHeader
          icon={<Wallet className="w-6 h-6" />}
          title="강사 정산"
          description="레슨 횟수·시급(또는 월급) 기준으로 급여를 계산하고 지출에 등록합니다"
        />
      )}

      {embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900">강사 정산</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              레슨 기록 × 시급, 또는 월급을 지출(인건비/강사료)로 등록합니다
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('teachers')}
            className="text-xs font-bold text-indigo-600 hover:underline min-h-[44px] self-start"
          >
            강사 시급·월급 설정
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedMonth}
          onChange={(e) => {
            setSelectedMonth(e.target.value);
            setAmountOverrides({});
          }}
          className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl min-h-[44px]"
        >
          {monthOptions.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SummaryCard label="레슨 합계" value={`${totals.lessonCount}회`} />
        <SummaryCard
          label="미정산"
          value={formatCurrency(totals.pendingAmount)}
          sub={`${totals.pendingCount}명`}
        />
        <SummaryCard
          label="정산 완료"
          value={formatCurrency(totals.settledAmount)}
          sub={`${totals.settledCount}명`}
        />
        <SummaryCard label="대상 강사" value={`${rows.length}명`} />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          등록된 활성 강사가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const settled = Boolean(row.settledExpenseId);
            const amount = resolveAmount(row);
            return (
              <div
                key={row.teacherId}
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{row.teacherName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {payTypeLabel(row.payType)}
                      {row.payType === 'hourly' && row.rate > 0
                        ? ` · ${formatCurrency(row.rate)}/회`
                        : ''}
                      {row.payType === 'monthly' && row.rate > 0
                        ? ` · ${formatCurrency(row.rate)}/월`
                        : ''}
                      {row.payType === 'none' ? ' · 강사 정보에서 시급/월급을 설정하세요' : ''}
                    </p>
                  </div>
                  {settled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      정산됨
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-[10px] text-slate-500 font-bold">레슨 횟수</p>
                    <p className="font-black text-slate-900 mt-0.5">{row.lessonCount}회</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2 sm:col-span-2">
                    <p className="text-[10px] text-slate-500 font-bold mb-1">정산 금액</p>
                    {settled ? (
                      <p className="font-black text-emerald-700">
                        {formatCurrency(row.settledAmount || 0)}
                      </p>
                    ) : (
                      <CurrencyInput
                        value={amount}
                        onChange={(v) =>
                          setAmountOverrides((prev) => ({ ...prev, [row.teacherId]: v }))
                        }
                      />
                    )}
                  </div>
                </div>

                {!settled && (
                  <button
                    type="button"
                    onClick={() => handleSettle(row)}
                    disabled={amount <= 0}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl"
                  >
                    지출로 등록
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-slate-400 leading-relaxed">
        레슨 횟수는 「오늘 레슨」에 저장된 기록을 기준으로 집계합니다. 등록된 지출은 지출
        관리의 강사료/인건비 카테고리에서 확인할 수 있습니다.
      </p>
    </div>
  );
};

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[10px] font-bold text-slate-500">{label}</p>
      <p className="text-sm font-black text-slate-900 mt-0.5 tabular-nums">{value}</p>
      {sub ? <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p> : null}
    </div>
  );
}
