import type { ReactNode } from 'react';
import type { NavTab } from '@/context/AppContext';
import type { Student } from '@/types';
import { PageHeader, SummaryMetricCard, EmptyState } from '@/shared/components';
import { formatKoreanDate } from '@/utils/formatters';
import { CheckSquare, UserPlus, Users } from 'lucide-react';

export interface DashboardMetricCard {
  label: string;
  value: string;
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'teal';
  onClick?: () => void;
}

interface IndustryDashboardShellProps {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  today: string;
  metrics: DashboardMetricCard[];
  metricsGridClassName?: string;
  students: Student[];
  checkedInToday: number;
  customerSingular: string;
  customerAddLabel: string;
  recentSectionTitle: string;
  recentEmptyDescription: string;
  attendanceCheckedInLabel: string;
  attendanceActiveLabel: string;
  attendanceButtonLabel: string;
  accentClassName: string;
  accentBorderClassName: string;
  accentHoverClassName: string;
  accentButtonClassName: string;
  onOpenStudents: () => void;
  onSelectStudent: (studentId: string) => void;
  onOpenAttendance: () => void;
  extraPanels?: ReactNode;
}

export function IndustryDashboardShell({
  icon,
  iconClassName,
  title,
  description,
  today,
  metrics,
  metricsGridClassName = 'grid grid-cols-2 sm:grid-cols-4 gap-3',
  students,
  checkedInToday,
  customerSingular,
  customerAddLabel,
  recentSectionTitle,
  recentEmptyDescription,
  attendanceCheckedInLabel,
  attendanceActiveLabel,
  attendanceButtonLabel,
  accentClassName,
  accentBorderClassName,
  accentHoverClassName,
  accentButtonClassName,
  onOpenStudents,
  onSelectStudent,
  onOpenAttendance,
  extraPanels,
}: IndustryDashboardShellProps) {
  const recentStudents = [...students]
    .sort((a, b) => b.joinDate.localeCompare(a.joinDate))
    .slice(0, 6);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={icon}
        iconClassName={iconClassName}
        title={title}
        description={`${formatKoreanDate(today)} · ${description}`}
      />

      <div className={metricsGridClassName}>
        {metrics.map((metric) => (
          <SummaryMetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            variant={metric.variant}
            onClick={metric.onClick}
          />
        ))}
      </div>

      {extraPanels}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Users className={`w-4 h-4 ${accentClassName}`} />
              {recentSectionTitle}
            </h3>
            <button
              type="button"
              onClick={onOpenStudents}
              className={`text-xs font-bold hover:underline min-h-[44px] px-2 ${accentClassName}`}
            >
              전체 보기
            </button>
          </div>
          {students.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title={`등록된 ${customerSingular}이 없습니다`}
              description={recentEmptyDescription}
              action={
                <button
                  type="button"
                  onClick={onOpenStudents}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-white text-xs font-bold ${accentButtonClassName}`}
                >
                  <UserPlus className="w-4 h-4" />
                  {customerAddLabel}
                </button>
              }
              className="p-6 border-0 shadow-none bg-slate-50/50 rounded-xl"
            />
          ) : (
            <div className="space-y-2">
              {recentStudents.map((student) => (
                <button
                  key={student.id}
                  type="button"
                  onClick={() => onSelectStudent(student.id)}
                  className={`w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors min-h-[44px] ${accentHoverClassName}`}
                >
                  <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {student.level} · 등록 {student.joinDate.slice(0, 10)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            {attendanceCheckedInLabel}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold">입실</p>
              <p className="text-2xl font-black text-emerald-900 mt-1">{checkedInToday}명</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-xs text-slate-500 font-semibold">{attendanceActiveLabel}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{students.length}명</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAttendance}
            className={`mt-4 w-full py-3 min-h-[44px] rounded-xl border text-xs font-bold transition-colors ${accentBorderClassName}`}
          >
            {attendanceButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
