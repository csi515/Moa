import { useMemo, type FC } from 'react';
import { BarChart3 } from 'lucide-react';
import { useApp, type NavTab } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { PageHeader, SegmentedControl } from '@/shared/components';
import { FinanceOverviewView } from './FinanceOverviewView';
import { IncomeManagementView } from './IncomeManagementView';
import { ExpenseManagementView } from './ExpenseManagementView';
import { TuitionManagementView } from '@/core/academy/components/tuition/TuitionManagementView';
import { UnpaidManagementView } from '@/core/academy/components/unpaid/UnpaidManagementView';

export type FinanceHubSegment = 'overview' | 'income' | 'expenses' | 'tuition' | 'unpaid';

const SEGMENT_TO_TAB: Record<FinanceHubSegment, NavTab> = {
  overview: 'finance',
  income: 'income',
  expenses: 'expenses',
  tuition: 'tuition',
  unpaid: 'unpaid',
};

function tabToSegment(tab: string, preferTuitionDefault: boolean): FinanceHubSegment {
  if (tab === 'income') return 'income';
  if (tab === 'expenses') return 'expenses';
  if (tab === 'tuition') return 'tuition';
  if (tab === 'unpaid') return 'unpaid';
  if (tab === 'finance' && preferTuitionDefault) return 'tuition';
  return 'overview';
}

/** 재무 업무 영역 허브 — 요약·수입·지출·수납·미납 */
export const FinanceHubView: FC<{ showBilling?: boolean }> = ({ showBilling = true }) => {
  const { activeTab, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const billingEnabled = showBilling && industry !== 'pilates';
  const isPiano = industry === 'piano';
  const hubTitle = isPiano ? '수납' : '재무';

  const segment = useMemo(() => {
    const next = tabToSegment(activeTab, isPiano && billingEnabled);
    if (!billingEnabled && (next === 'tuition' || next === 'unpaid')) return 'overview';
    return next;
  }, [activeTab, billingEnabled, isPiano]);

  const options = useMemo(() => {
    if (billingEnabled && isPiano) {
      return [
        { value: 'tuition' as const, label: '수납' },
        { value: 'unpaid' as const, label: '미납' },
        { value: 'overview' as const, label: '요약' },
        { value: 'income' as const, label: '수입' },
        { value: 'expenses' as const, label: '지출' },
      ];
    }
    const base: { value: FinanceHubSegment; label: string }[] = [
      { value: 'overview', label: '요약' },
      { value: 'income', label: '수입' },
      { value: 'expenses', label: '지출' },
    ];
    if (billingEnabled) {
      base.push(
        { value: 'tuition', label: industry === 'daycare' ? '보육료' : '수납' },
        { value: 'unpaid', label: '미납' }
      );
    }
    return base;
  }, [billingEnabled, industry, isPiano]);

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<BarChart3 className="w-6 h-6" />}
        title={hubTitle}
        description={
          industry === 'piano' ? '월 수강료·미납을 확인하고 수입·지출을 함께 관리합니다' : undefined
        }
        actions={
          <SegmentedControl
            value={segment}
            options={options}
            onChange={(next) => setActiveTab(SEGMENT_TO_TAB[next])}
            aria-label={`${hubTitle} 메뉴`}
            fullWidth
            className="w-full sm:w-auto min-w-[260px]"
          />
        }
      />

      {segment === 'overview' && <FinanceOverviewView embedded />}
      {segment === 'income' && <IncomeManagementView embedded />}
      {segment === 'expenses' && <ExpenseManagementView embedded />}
      {segment === 'tuition' && <TuitionManagementView embedded />}
      {segment === 'unpaid' && <UnpaidManagementView embedded />}
    </div>
  );
};
