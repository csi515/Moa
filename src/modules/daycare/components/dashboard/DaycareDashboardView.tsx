import type { FC } from 'react';
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard, EmptyState } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Baby, Users, UserPlus, CheckSquare, BookOpen, Pill, Megaphone } from 'lucide-react';
import { useModuleLabels } from '@/core/labels';
import { filterParentNotices } from '@/core/notices';

export const DaycareDashboardView: FC = () => {
  const { setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const refreshKey = useStorageRefresh();
  const { isScoped, scopeStudents, scopeClasses } = useStaffScope();

  const today = new Date().toISOString().slice(0, 10);
  const dayIndex = new Date().getDay();
  const dayMap: Record<number, string> = { 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
  const todayKorean = dayMap[dayIndex] || '월';

  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const classes = useMemo(
    () => scopeClasses(StorageService.getClasses()),
    [scopeClasses, refreshKey]
  );
  const todayClasses = useMemo(
    () => classes.filter((c) => c.daysOfWeek.includes(todayKorean as (typeof c.daysOfWeek)[number])),
    [classes, todayKorean]
  );
  const sessions = StorageService.getAttendanceSessions().filter((s) => s.sessionDate === today);
  const checkedInToday = new Set(sessions.filter((s) => s.checkInAt).map((s) => s.customerId)).size;
  const teachers = StorageService.getTeachers().filter((t) => t.status === 'active');
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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Baby className="w-6 h-6" />}
        iconClassName="text-sky-600"
        title="어린이집 대시보드"
        description={`${formatKoreanDate(today)} · 원아·등하원·보육 기록`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <SummaryMetricCard
          label={`재원 ${labels.customer.singular}`}
          value={`${students.length}명`}
          variant="indigo"
          onClick={() => {
            setSelectedStudentId(null);
            setActiveTab('students');
          }}
        />
        <SummaryMetricCard
          label="오늘 등원"
          value={`${checkedInToday}명`}
          variant="emerald"
          onClick={() => setActiveTab('attendance')}
        />
        <SummaryMetricCard
          label="오늘 알림장"
          value={`${todayJournals}건`}
          variant="teal"
          onClick={() => setActiveTab('journals')}
        />
        <SummaryMetricCard
          label="투약 대기"
          value={`${pendingMeds}건`}
          variant={pendingMeds > 0 ? 'amber' : 'default'}
          onClick={() => setActiveTab('medications')}
        />
        {isScoped ? (
          <SummaryMetricCard
            label="오늘 반"
            value={`${todayClasses.length}개`}
            variant="teal"
            onClick={() => setActiveTab('timetable')}
          />
        ) : (
          <SummaryMetricCard
            label={labels.staff.plural}
            value={`${teachers.length}명`}
            onClick={() => setActiveTab('teachers')}
          />
        )}
        <SummaryMetricCard
          label="운영 반"
          value={`${classes.length}개`}
          onClick={() => setActiveTab('classes')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" />
              최근 등록 {labels.customer.singular}
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(null);
                setActiveTab('students');
              }}
              className="text-xs font-bold text-sky-600 hover:underline min-h-[44px] px-2"
            >
              전체 보기
            </button>
          </div>
          {students.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={`등록된 ${labels.customer.singular}가 없습니다`}
              description="원아를 등록하고 연령반·보호자·등하원 PIN을 설정하세요."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId(null);
                    setActiveTab('students');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold"
                >
                  <UserPlus className="w-4 h-4" />
                  {labels.customer.add}
                </button>
              }
              className="p-6 border-0 shadow-none bg-slate-50/50 rounded-xl"
            />
          ) : (
            <div className="space-y-2">
              {[...students]
                .sort((a, b) => b.joinDate.localeCompare(a.joinDate))
                .slice(0, 6)
                .map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(s.id);
                      setActiveTab('students');
                    }}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-sky-200 hover:bg-sky-50/30 transition-colors min-h-[44px]"
                  >
                    <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.level} · 입소 {s.joinDate.slice(0, 10)}
                    </p>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            오늘 등하원·보육
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold">등원</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{checkedInToday}명</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold">재원 원아</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{students.length}명</p>
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
};
