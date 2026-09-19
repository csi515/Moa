import { useMemo, type FC } from 'react';
import { BarChart3 } from 'lucide-react';
import { useApp, type NavTab } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { isAppointmentIndustry } from '@/core/industry/industryUi';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { FinanceOverviewView } from './FinanceOverviewView';
import { IncomeManagementView } from './IncomeManagementView';
import { ExpenseManagementView } from './ExpenseManagementView';
import { TuitionManagementView } from '@/core/academy/components/tuition/TuitionManagementView';
import { UnpaidManagementView } from '@/core/academy/components/unpaid/UnpaidManagementView';
import { TeacherPayrollView } from './TeacherPayrollView';

export type FinanceHubSegment =
  | 'overview'
  | 'income'
  | 'expenses'
  | 'tuition'
  | 'unpaid'
  | 'payroll';

const SEGMENT_TO_TAB: Record<FinanceHubSegment, NavTab> = {
  overview: 'finance',
  income: 'income',
  expenses: 'expenses',
  tuition: 'tuition',
  unpaid: 'unpaid',
  payroll: 'payroll',
};

function tabToSegment(tab: string, preferTuitionDefault: boolean): FinanceHubSegment {
  if (tab === 'income') return 'income';
  if (tab === 'expenses') return 'expenses';
  if (tab === 'tuition') return 'tuition';
  if (tab === 'unpaid') return 'unpaid';
  if (tab === 'payroll') return 'payroll';
  if (tab === 'finance' && preferTuitionDefault) return 'tuition';
  return 'overview';
}

const PIANO_BILLING_OPTIONS: { value: FinanceHubSegment; label: string }[] = [
  { value: 'tuition', label: '수납' },
  { value: 'unpaid', label: '미납' },
];

const PIANO_BOOKS_OPTIONS: { value: FinanceHubSegment; label: string }[] = [
  { value: 'income', label: '수입' },
  { value: 'expenses', label: '지출' },
  { value: 'payroll', label: '정산' },
];

/** 재무 업무 영역 허브 — 피아노는 수납·미납 중심, 수입·지출·정산은 별도 보기 */
export const FinanceHubView: FC<{ showBilling?: boolean }> = ({ showBilling = true }) => {
  const { activeTab, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const billingEnabled = showBilling && !isAppointmentIndustry(industry);
  const isPiano = industry === 'piano';
  const hubTitle = isPiano ? '수납·재무' : '재무';

  const segment = useMemo(() => {
    const next = tabToSegment(activeTab, isPiano && billingEnabled);
    if (!billingEnabled && (next === 'tuition' || next === 'unpaid')) return 'overview';
    return next;
  }, [activeTab, billingEnabled, isPiano]);

  const isPianoBooks =
    isPiano && (segment === 'income' || segment === 'expenses' || segment === 'payroll');

  const options = useMemo(() => {
    if (billingEnabled && isPiano) {
      return isPianoBooks ? PIANO_BOOKS_OPTIONS : PIANO_BILLING_OPTIONS;
    }
    const base: { value: FinanceHubSegment; label: string }[] = [
      { value: 'overview', label: '요약' },
      { value: 'income', label: '수입' },
      { value: 'expenses', label: '지출' },
      { value: 'payroll', label: '정산' },
    ];
    if (billingEnabled) {
      base.push(
        { value: 'tuition', label: industry === 'daycare' ? '보육료' : '수납' },
        { value: 'unpaid', label: '미납' }
      );
    }
    return base;
  }, [billingEnabled, industry, isPiano, isPianoBooks]);

  const description = isPiano
    ? isPianoBooks
      ? '수입·지출·강사 정산을 기록합니다'
      : '월 수강료 청구와 미납을 확인합니다'
    : undefined;

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<BarChart3 className="w-6 h-6" />}
        title={hubTitle}
        description={description}
        actions={
          <div className="w-full sm:w-auto space-y-2 min-w-0 sm:min-w-[220px]">
            {isPianoBooks && (
              <button
                type="button"
                onClick={() => setActiveTab('tuition')}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 min-h-[44px] sm:min-h-0"
              >
                ← 수납으로
              </button>
            )}
            <SegmentedControl
              value={segment}
              options={options}
              onChange={(next) => setActiveTab(SEGMENT_TO_TAB[next])}
              aria-label={`${hubTitle} 메뉴`}
              fullWidth
              className="w-full shadow-xs"
            />
            {isPiano && billingEnabled && !isPianoBooks && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span className="font-medium text-slate-400">재무</span>
                {PIANO_BOOKS_OPTIONS.map((opt, i) => (
                  <span key={opt.value} className="inline-flex items-center gap-x-3">
                    {i > 0 && (
                      <span aria-hidden className="text-slate-300">
                        ·
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab(SEGMENT_TO_TAB[opt.value])}
                      className="font-semibold text-slate-600 hover:text-indigo-600 min-h-[44px] sm:min-h-0 py-1"
                    >
                      {opt.label}
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        }
      />

      {segment === 'overview' && <FinanceOverviewView embedded />}
      {segment === 'income' && <IncomeManagementView embedded />}
      {segment === 'expenses' && <ExpenseManagementView embedded />}
      {segment === 'payroll' && <TeacherPayrollView embedded />}
      {segment === 'tuition' && <TuitionManagementView embedded />}
      {segment === 'unpaid' && <UnpaidManagementView embedded />}
    </div>
  );
};
