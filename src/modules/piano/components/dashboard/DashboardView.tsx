import React, { useMemo, useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import { StaffDashboardView } from './StaffDashboardView';
import { DashboardWelcomeSection } from './DashboardWelcomeSection';
import { DashboardStatsSection } from './DashboardStatsSection';
import { DashboardChartsSection } from './DashboardChartsSection';
import { DashboardPanelsSection } from './DashboardPanelsSection';
import { DashboardCustomizeModal } from './DashboardCustomizeModal';
import { isDashboardWidgetVisible, getConfiguredDashboardWidgets, resolveDashboardWidgetSet } from './dashboardWidgets';

export const DashboardView: React.FC = () => {
  const { setActiveTab, currentUser } = useApp();
  const { isStaff, isOwner, settings } = usePermissions();
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const isVisible = useMemo(
    () => (id: Parameters<typeof isDashboardWidgetVisible>[0]) =>
      isDashboardWidgetVisible(id, settings),
    [settings]
  );

  if (isStaff) {
    return <StaffDashboardView />;
  }

  const stats = StorageService.getDashboardStats();
  const tbStats = StorageService.getTextbookStats();
  const lowStockBooks = StorageService.getLowStockTextbooks();
  const recentSales = StorageService.getTextbookSales().slice(0, 4);
  const students = StorageService.getStudents();
  const recentInvoices = StorageService.getUnpaidInvoices().slice(0, 3);
  const unpaidStats = StorageService.getUnifiedUnpaidStats();
  const makeupPendingCount = StorageService.getMakeupItems().filter((m) => m.status === 'pending').length;
  const currentMonthLabel = `${parseInt(stats.currentYearMonth.slice(5, 7), 10)}월`;

  const configuredWidgets = getConfiguredDashboardWidgets(settings);
  const showEmptyHint = configuredWidgets !== undefined && resolveDashboardWidgetSet(settings).size === 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-end">
        {isOwner && (
          <button
            type="button"
            onClick={() => setCustomizeOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl min-h-[44px] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            대시보드 편집
          </button>
        )}
      </div>

      <DashboardWelcomeSection
        userName={currentUser.name}
        todayClassesCount={stats.todayClassesCount}
        activeStudents={stats.activeStudents}
        onNavigate={setActiveTab}
      />

      {showEmptyHint && (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-6 text-center">
          <p className="text-sm font-bold text-indigo-900">표시할 대시보드 항목이 없습니다</p>
          <p className="text-xs text-indigo-700 mt-1">대시보드 편집에서 필요한 기능을 선택해 주세요.</p>
        </div>
      )}

      <DashboardStatsSection
        stats={stats}
        textbookSalesAmount={tbStats.totalSalesAmount}
        lowStockCount={lowStockBooks.length}
        unpaidGrandTotal={unpaidStats.grandTotal}
        makeupPendingCount={makeupPendingCount}
        currentMonthLabel={currentMonthLabel}
        isVisible={isVisible}
        onNavigate={setActiveTab}
      />

      <DashboardChartsSection stats={stats} isVisible={isVisible} onNavigate={setActiveTab} />

      <DashboardPanelsSection
        stats={stats}
        students={students}
        recentInvoices={recentInvoices}
        tbStats={tbStats}
        recentSales={recentSales}
        lowStockBooks={lowStockBooks}
        currentMonthLabel={currentMonthLabel}
        isVisible={isVisible}
        onNavigate={setActiveTab}
      />

      {isOwner && (
        <DashboardCustomizeModal
          isOpen={customizeOpen}
          onClose={() => setCustomizeOpen(false)}
          settings={settings}
        />
      )}
    </div>
  );
};
