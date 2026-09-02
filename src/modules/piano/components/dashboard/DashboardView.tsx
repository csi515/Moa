import React from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { StaffDashboardView } from './StaffDashboardView';
import { DirectorDashboardWelcome } from './director/DirectorDashboardWelcome';
import { DirectorDashboardStats } from './director/DirectorDashboardStats';
import { DirectorDashboardCharts } from './director/DirectorDashboardCharts';
import { DirectorDashboardPanels } from './director/DirectorDashboardPanels';
import { useDirectorDashboard } from './director/useDirectorDashboard';

export const DashboardView: React.FC = () => {
  const { setActiveTab, currentUser } = useApp();
  const { isStaff } = usePermissions();

  if (isStaff) {
    return <StaffDashboardView />;
  }

  const data = useDirectorDashboard();

  return (
    <div className="space-y-6 pb-12">
      <DirectorDashboardWelcome
        currentUserName={currentUser.name}
        stats={data.stats}
        setActiveTab={setActiveTab}
      />
      <DirectorDashboardStats
        stats={data.stats}
        unpaidStats={data.unpaidStats}
        makeupPendingCount={data.makeupPendingCount}
        currentMonthLabel={data.currentMonthLabel}
        tbStats={data.tbStats}
        lowStockCount={data.lowStockBooks.length}
        setActiveTab={setActiveTab}
      />
      <DirectorDashboardCharts
        stats={data.stats}
        hasRevenueData={data.hasRevenueData}
        hasStudentTrendData={data.hasStudentTrendData}
        hasTuitionData={data.hasTuitionData}
        hasClassData={data.hasClassData}
        setActiveTab={setActiveTab}
      />
      <DirectorDashboardPanels
        stats={data.stats}
        students={data.students}
        recentInvoices={data.recentInvoices}
        tbStats={data.tbStats}
        recentSales={data.recentSales}
        lowStockBooks={data.lowStockBooks}
        currentMonthLabel={data.currentMonthLabel}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};
