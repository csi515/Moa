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
import { Baby, BookOpen, Pill, Megaphone } from 'lucide-react';
import { useModuleLabels } from '@/core/labels';
import { filterParentNotices } from '@/core/notices';

export const DaycareDashboardView: FC = () => {
  const { setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const refreshKey = useStorageRefresh();
  const { scopeStudents } = useStaffScope();
  const isVisible = useDashboardWidgetVisibility('daycare');

  const today = new Date().toISOString().slice(0, 10);
  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const checkedInToday = countTodayCheckedInCustomers(StorageService.getAttendanceSessions(), today);
  const teachers = StorageService.getTeachers().filter((t) => t.status === 'active');
  const classes = StorageService.getClasses();
  const todayJournals = useMemo(
    () => StorageService.getCareJournals().filter((j) => j.journalDate === today).length,
    [refreshKey, today]
  );
  const pendingMeds = useMemo(
    () =>
      StorageService.getMedicationRequests().filter(
        (m) => m.requestDate === today && m.status === 'requested'
      ).length,
    [refreshKey, today]
  );
  const draftNotices = useMemo(
    () =>
      filterParentNotices(StorageService.getNotifications()).filter(
        (n) => (n.status || 'pending') === 'pending'
      ).length,
    [refreshKey]
  );

  const openStudents = () => {
    setSelectedStudentId(null);
    setActiveTab('students');
  };

  return (
    <div className="space-y-6 pb-12">
      <DashboardEditToolbar />

      <PageHeader
        icon={<Baby className="w-6 h-6" />}
        iconClassName="text-sky-600"
        title="어린이집 대시보드"
        description={`${formatKoreanDate(today)} · 원아·등하원·보육 기록`}
      />

      <DashboardMetricGrid columns="2-6">
        {isVisible('stat_active_children') && (
          <SummaryMetricCard
            label={`재원 ${labels.customer.singular}`}
            value={`${students.length}명`}
            variant="indigo"
            onClick={openStudents}
          />
        )}
        {isVisible('stat_checked_in') && (
          <SummaryMetricCard
            label="오늘 등원"
            value={`${checkedInToday}명`}
            variant="emerald"
            onClick={() => setActiveTab('attendance')}
          />
        )}
        {isVisible('stat_today_journals') && (
          <SummaryMetricCard
            label="오늘 알림장"
            value={`${todayJournals}건`}
            variant="teal"
            onClick={() => setActiveTab('journals')}
          />
        )}
        {isVisible('stat_pending_meds') && (
          <SummaryMetricCard
            label="투약 대기"
            value={`${pendingMeds}건`}
            variant={pendingMeds > 0 ? 'amber' : 'default'}
            onClick={() => setActiveTab('medications')}
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
            label="운영 반"
            value={`${classes.length}개`}
            onClick={() => setActiveTab('classes')}
          />
        )}
      </DashboardMetricGrid>

      <DashboardPanelGrid
        panels={[
          {
            key: 'panel_recent_children',
            visible: isVisible('panel_recent_children'),
            content: (
              <RecentRegistrationsPanel
                customers={students}
                accent="sky"
                title={`최근 등록 ${labels.customer.singular}`}
                emptyTitle={`등록된 ${labels.customer.singular}가 없습니다`}
                emptyDescription="원아를 등록하고 연령반·보호자·등하원 PIN을 설정하세요."
                addLabel={labels.customer.add}
                dateLabel="입소"
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
            key: 'panel_attendance_care',
            visible: isVisible('panel_attendance_care'),
            content: (
              <AttendanceSummaryPanel
                title="오늘 등하원·보육"
                checkedInLabel="등원"
                activeLabel="재원 원아"
                checkedInToday={checkedInToday}
                activeCount={students.length}
                accent="sky"
                primaryActionLabel="등·하원"
                onPrimaryAction={() => setActiveTab('attendance')}
                footer={
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('attendance')}
                      className="py-3 min-h-[44px] rounded-xl border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-50 transition-colors"
                    >
                      등·하원
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('journals')}
                      className="inline-flex items-center justify-center gap-1.5 py-3 min-h-[44px] rounded-xl border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-50 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      알림장 {todayJournals}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('medications')}
                      className="inline-flex items-center justify-center gap-1.5 py-3 min-h-[44px] rounded-xl border border-amber-200 text-amber-800 text-xs font-bold hover:bg-amber-50 transition-colors"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      투약 대기 {pendingMeds}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('notices')}
                      className="inline-flex items-center justify-center gap-1.5 py-3 min-h-[44px] rounded-xl border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-50 transition-colors"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      가정통신문{draftNotices > 0 ? ` 임시 ${draftNotices}` : ''}
                    </button>
                  </div>
                }
              />
            ),
          },
        ]}
      />
    </div>
  );
};
