import type { FC } from 'react';
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStaffScope } from '@/hooks';
import {
  DashboardEditToolbar,
  DashboardMetricGrid,
  DashboardPanelGrid,
  RecentRegistrationsPanel,
  AttendanceSummaryPanel,
  useDashboardWidgetVisibility,
} from '@/core/dashboard';
import { countTodayCheckedInCustomers } from '@/core/attendance';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Dumbbell } from 'lucide-react';
import { useModuleLabels } from '@/core/labels';

export const GymDashboardView: FC = () => {
  const { setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const refreshKey = useStorageRefresh();
  const { scopeStudents } = useStaffScope();
  const isVisible = useDashboardWidgetVisibility('gym');

  const today = new Date().toISOString().slice(0, 10);
  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const checkedInToday = countTodayCheckedInCustomers(StorageService.getAttendanceSessions(), today);
  const teachers = StorageService.getTeachers().filter((t) => t.status === 'active');
  const classes = StorageService.getClasses();

  const openStudents = () => {
    setSelectedStudentId(null);
    setActiveTab('students');
  };

  return (
    <div className="space-y-6 pb-12">
      <DashboardEditToolbar />

      <PageHeader
        icon={<Dumbbell className="w-6 h-6" />}
        iconClassName="text-orange-600"
        title="체육관 대시보드"
        description={`${formatKoreanDate(today)} · 회원·출결·수업반 현황`}
      />

      <DashboardMetricGrid>
        {isVisible('stat_active_members') && (
          <SummaryMetricCard
            label={`재적 ${labels.customer.singular}`}
            value={`${students.length}명`}
            variant="amber"
            onClick={openStudents}
          />
        )}
        {isVisible('stat_checked_in') && (
          <SummaryMetricCard
            label="오늘 입실"
            value={`${checkedInToday}명`}
            variant="emerald"
            onClick={() => setActiveTab('attendance')}
          />
        )}
        {isVisible('stat_teachers') && (
          <SummaryMetricCard
            label={labels.staff.plural}
            value={`${teachers.length}명`}
            onClick={() => setActiveTab('teachers')}
          />
        )}
        {isVisible('stat_classes') && (
          <SummaryMetricCard
            label="수업반"
            value={`${classes.length}개`}
            onClick={() => setActiveTab('classes')}
          />
        )}
      </DashboardMetricGrid>

      <DashboardPanelGrid
        panels={[
          {
            key: 'panel_recent_members',
            visible: isVisible('panel_recent_members'),
            content: (
              <RecentRegistrationsPanel
                customers={students}
                accent="orange"
                title={`최근 등록 ${labels.customer.singular}`}
                emptyTitle={`등록된 ${labels.customer.singular}이 없습니다`}
                emptyDescription="회원을 등록하고 수업 레벨, 보호자, PIN을 설정하세요."
                addLabel={labels.customer.add}
                dateLabel="등록"
                onViewAll={openStudents}
                onAdd={openStudents}
                onSelect={(id) => {
                  setSelectedStudentId(id);
                  setActiveTab('students');
                }}
              />
            ),
          },
          {
            key: 'panel_attendance_summary',
            visible: isVisible('panel_attendance_summary'),
            content: (
              <AttendanceSummaryPanel
                title="오늘 출입 요약"
                checkedInLabel="입실"
                activeLabel="재적 회원"
                checkedInToday={checkedInToday}
                activeCount={students.length}
                accent="orange"
                primaryActionLabel="출입 관리 열기"
                onPrimaryAction={() => setActiveTab('attendance')}
              />
            ),
          },
        ]}
      />
    </div>
  );
};
