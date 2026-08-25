import type { FC } from 'react';
import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh, useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import { PageHeader, SummaryMetricCard, EmptyState } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { Shield, Users, UserPlus, CheckSquare } from 'lucide-react';
import { useModuleLabels } from '@/core/labels';

export const TaekwondoDashboardView: FC = () => {
  const { setActiveTab, setSelectedStudentId } = useApp();
  const labels = useModuleLabels();
  const refreshKey = useStorageRefresh();
  const { scopeStudents } = useStaffScope();

  const today = new Date().toISOString().slice(0, 10);
  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const sessions = StorageService.getAttendanceSessions().filter((s) => s.sessionDate === today);
  const checkedInToday = new Set(sessions.filter((s) => s.checkInAt).map((s) => s.customerId)).size;
  const teachers = StorageService.getTeachers().filter((t) => t.status === 'active');
  const classes = StorageService.getClasses();

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Shield className="w-6 h-6" />}
        iconClassName="text-red-600"
        title="태권도장 대시보드"
        description={`${formatKoreanDate(today)} · 수련생·출결·수업반 현황`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryMetricCard
          label={`재원 ${labels.customer.singular}`}
          value={`${students.length}명`}
          variant="rose"
          onClick={() => {
            setSelectedStudentId(null);
            setActiveTab('students');
          }}
        />
        <SummaryMetricCard
          label="오늘 입실"
          value={`${checkedInToday}명`}
          variant="emerald"
          onClick={() => setActiveTab('attendance')}
        />
        <SummaryMetricCard
          label={labels.staff.plural}
          value={`${teachers.length}명`}
          onClick={() => setActiveTab('teachers')}
        />
        <SummaryMetricCard
          label="수업반"
          value={`${classes.length}개`}
          onClick={() => setActiveTab('classes')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              최근 등록 {labels.customer.singular}
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedStudentId(null);
                setActiveTab('students');
              }}
              className="text-xs font-bold text-red-600 hover:underline min-h-[44px] px-2"
            >
              전체 보기
            </button>
          </div>
          {students.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={`등록된 ${labels.customer.singular}이 없습니다`}
              description="수련생을 등록하고 띠/급, 보호자, PIN을 설정하세요."
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudentId(null);
                    setActiveTab('students');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
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
                    className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-red-200 hover:bg-red-50/30 transition-colors min-h-[44px]"
                  >
                    <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.level} · 입관 {s.joinDate.slice(0, 10)}
                    </p>
                  </button>
                ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            오늘 출입 요약
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold">입실</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{checkedInToday}명</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold">재원생</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{students.length}명</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className="mt-4 w-full py-3 min-h-[44px] rounded-xl border border-red-200 text-red-700 text-xs font-bold hover:bg-red-50 transition-colors"
          >
            출입 관리 열기
          </button>
        </div>
      </div>
    </div>
  );
};
