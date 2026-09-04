import React from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { StaffDashboardView } from './StaffDashboardView';
import { DirectorTodayHome } from './director/DirectorTodayHome';
import { useDirectorTodayDashboard } from './director/useDirectorTodayDashboard';

/**
 * 피아노 홈
 * - 원장/관리자: 오늘 업무 중심 (일정·출결·상담·미납·빠른 작업)
 * - 강사: 담당 범위 축소 대시보드
 * - 기존 통계/차트 패널은 유지하되 기본 홈에서는 노출하지 않음
 */
export const DashboardView: React.FC = () => {
  const { setActiveTab, currentUser } = useApp();
  const { isStaff } = usePermissions();

  if (isStaff) {
    return <StaffDashboardView />;
  }

  const data = useDirectorTodayDashboard();

  return (
    <DirectorTodayHome
      currentUserName={currentUser.name}
      data={data}
      setActiveTab={setActiveTab}
    />
  );
};
