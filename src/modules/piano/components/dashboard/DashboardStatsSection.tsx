import React from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  CreditCard,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  TrendingUp,
  BookOpen,
  Package,
} from 'lucide-react';
import { StatCard } from '@/shared/components/StatCard';
import { formatCurrency } from '@/utils/formatters';
import type { NavTab } from '@/context/AppContext';
import type { PianoDashboardWidgetId } from '@/core/dashboard';

import type { PianoDashboardStats } from './dashboardTypes';

interface DashboardStatsSectionProps {
  stats: PianoDashboardStats;
  textbookSalesAmount: number;
  lowStockCount: number;
  unpaidGrandTotal: number;
  makeupPendingCount: number;
  currentMonthLabel: string;
  isVisible: (id: PianoDashboardWidgetId) => boolean;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardStatsSection: React.FC<DashboardStatsSectionProps> = ({
  stats,
  textbookSalesAmount,
  lowStockCount,
  unpaidGrandTotal,
  makeupPendingCount,
  currentMonthLabel,
  isVisible,
  onNavigate,
}) => {
  const cards = [
    isVisible('stat_total_students') && (
      <StatCard
        key="stat_total_students"
        title="전체 원생"
        value={`${stats.totalStudents}명`}
        subtitle={`재원 ${stats.activeStudents} / 휴원 ${stats.leaveStudents}`}
        icon={<Users className="w-5 h-5 text-indigo-600" />}
        iconBg="bg-indigo-50"
        onClick={() => onNavigate('students')}
      />
    ),
    isVisible('stat_active_students') && (
      <StatCard
        key="stat_active_students"
        title="수강 중 (재원)"
        value={`${stats.activeStudents}명`}
        subtitle="현재 정규 수강 중"
        icon={<UserCheck className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
        onClick={() => onNavigate('students')}
      />
    ),
    isVisible('stat_new_students') && (
      <StatCard
        key="stat_new_students"
        title="신규 등록 (이번달)"
        value={`${stats.newStudentsThisMonth}명`}
        subtitle={`${currentMonthLabel} 신규 입학`}
        icon={<UserPlus className="w-5 h-5 text-teal-600" />}
        iconBg="bg-teal-50"
        onClick={() => onNavigate('students')}
      />
    ),
    isVisible('stat_tuition_revenue') && (
      <StatCard
        key="stat_tuition_revenue"
        title="수강료 매출"
        value={formatCurrency(stats.totalPaidThisMonth)}
        subtitle={`수납률 ${stats.collectionRate}% (청구 ${formatCurrency(stats.totalBilledThisMonth)})`}
        icon={<CreditCard className="w-5 h-5 text-blue-600" />}
        iconBg="bg-blue-50"
        onClick={() => onNavigate('tuition')}
        highlight
      />
    ),
    isVisible('stat_unpaid_tuition') && (
      <StatCard
        key="stat_unpaid_tuition"
        title="미납 수강료"
        value={formatCurrency(stats.totalUnpaidThisMonth)}
        subtitle={`미납 원생 ${stats.unpaidStudentsCount}명 · 통합 ${formatCurrency(unpaidGrandTotal)}`}
        icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
        iconBg="bg-rose-50"
        onClick={() => onNavigate('unpaid')}
      />
    ),
    isVisible('stat_today_classes') && (
      <StatCard
        key="stat_today_classes"
        title="오늘 수업"
        value={`${stats.todayClassesCount}개`}
        subtitle="개설된 정규 클래스"
        icon={<Clock className="w-5 h-5 text-purple-600" />}
        iconBg="bg-purple-50"
        onClick={() => onNavigate('timetable')}
      />
    ),
    isVisible('stat_today_present') && (
      <StatCard
        key="stat_today_present"
        title="오늘 출석"
        value={`${stats.todayPresent}명`}
        subtitle={`지각/조퇴 ${stats.todayLate}명`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
        onClick={() => onNavigate('attendance')}
      />
    ),
    isVisible('stat_today_absent') && (
      <StatCard
        key="stat_today_absent"
        title="오늘 결석"
        value={`${stats.todayAbsent}명`}
        subtitle={makeupPendingCount > 0 ? `미보강 ${makeupPendingCount}건 확인 필요` : '보강 일정 확인 필요'}
        icon={<XCircle className="w-5 h-5 text-amber-600" />}
        iconBg="bg-amber-50"
        onClick={() => onNavigate('makeups')}
      />
    ),
    isVisible('stat_textbook_sales') && (
      <StatCard
        key="stat_textbook_sales"
        title="교재 판매액 (이번달)"
        value={formatCurrency(textbookSalesAmount)}
        subtitle={`수납·미납은 교재 관리에서 확인`}
        icon={<BookOpen className="w-5 h-5 text-amber-600" />}
        iconBg="bg-amber-50"
        onClick={() => onNavigate('textbooks')}
      />
    ),
    isVisible('stat_low_stock') && (
      <StatCard
        key="stat_low_stock"
        title="재고 부족 교재"
        value={`${lowStockCount}종`}
        subtitle="교재 재고 확인"
        icon={<Package className="w-5 h-5 text-rose-600" />}
        iconBg="bg-rose-50"
        onClick={() => onNavigate('textbooks')}
      />
    ),
    isVisible('stat_monthly_expenses') && (
      <StatCard
        key="stat_monthly_expenses"
        title="이번 달 지출"
        value={formatCurrency(stats.totalExpensesThisMonth)}
        subtitle="임대료, 관리비, 조율비 등"
        icon={<Receipt className="w-5 h-5 text-orange-600" />}
        iconBg="bg-orange-50"
        onClick={() => onNavigate('expenses')}
      />
    ),
    isVisible('stat_net_profit') && (
      <StatCard
        key="stat_net_profit"
        title="이번 달 순수익"
        value={formatCurrency(stats.netProfitThisMonth)}
        subtitle="수강료+교재매출 - 지출"
        icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        iconBg="bg-emerald-50"
        onClick={() => onNavigate('tuition')}
      />
    ),
  ].filter(Boolean);

  if (cards.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-600" />
        학원 핵심 운영 지표
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-4">
        {cards}
      </div>
    </div>
  );
};
