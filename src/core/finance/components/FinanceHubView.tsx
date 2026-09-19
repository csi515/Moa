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

type PianoFinanceArea = 'billing' | 'books';

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

function pianoAreaFromSegment(segment: FinanceHubSegment): PianoFinanceArea {
  if (segment === 'income' || segment === 'expenses' || segment === 'payroll') return 'books';
  return 'billing';
}

const PIANO_AREA_OPTIONS: { value: PianoFinanceArea; label: string }[] = [
  { value: 'billing', label: '수납' },
  { value: 'books', label: '재무 관리' },
];

const PIANO_BILLING_OPTIONS: { value: FinanceHubSegment; label: string }[] = [
  { value: 'tuition', label: '수납' },
  { value: 'unpaid', label: '미납' },
];

const PIANO_BOOKS_OPTIONS: { value: FinanceHubSegment; label: string }[] = [
  { value: 'income', label: '수입' },
  { value: 'expenses', label: '지출' },
  { value: 'payroll', label: '정산' },
];

/** 재무 업무 영역 허브 — 피아노는 수납 / 재무 관리로 구분 */
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

  const pianoArea = pianoAreaFromSegment(segment);

  const genericOptions = useMemo(() => {
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
  }, [billingEnabled, industry]);

  const description = isPiano
    ? pianoArea === 'books'
      ? segment === 'payroll'
        ? '강사 정산을 확인하고 지출로 등록합니다'
        : '수입·지출·강사 정산을 관리합니다'
      : '월 수강료 청구와 미납을 확인합니다'
    : undefined;

  const handlePianoAreaChange = (area: PianoFinanceArea) => {
    if (area === pianoArea) return;
    setActiveTab(area === 'billing' ? 'tuition' : 'income');
  };

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<BarChart3 className="w-6 h-6" />}
        title={hubTitle}
        description={description}
      />

      {isPiano && billingEnabled ? (
        <div className="space-y-3 min-w-0">
          <SegmentedControl
            value={pianoArea}
            options={PIANO_AREA_OPTIONS}
            onChange={handlePianoAreaChange}
            aria-label="수납·재무 영역"
            fullWidth
            className="w-full shadow-xs"
          />
          <SegmentedControl
            value={segment}
            options={pianoArea === 'books' ? PIANO_BOOKS_OPTIONS : PIANO_BILLING_OPTIONS}
            onChange={(next) => setActiveTab(SEGMENT_TO_TAB[next])}
            aria-label={pianoArea === 'books' ? '재무 관리 메뉴' : '수납 메뉴'}
            fullWidth
            className="w-full shadow-xs"
          />
        </div>
      ) : (
        <SegmentedControl
          value={segment}
          options={genericOptions}
          onChange={(next) => setActiveTab(SEGMENT_TO_TAB[next])}
          aria-label={`${hubTitle} 메뉴`}
          fullWidth
          className="w-full shadow-xs sm:w-auto sm:min-w-[280px]"
        />
      )}

      {segment === 'overview' && <FinanceOverviewView embedded />}
      {segment === 'income' && <IncomeManagementView embedded />}
      {segment === 'expenses' && <ExpenseManagementView embedded />}
      {segment === 'payroll' && <TeacherPayrollView embedded />}
      {segment === 'tuition' && <TuitionManagementView embedded />}
      {segment === 'unpaid' && <UnpaidManagementView embedded />}
    </div>
  );
};
