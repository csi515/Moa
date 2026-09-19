import { useMemo, type FC } from 'react';
import { useApp } from '@/context/AppContext';
import { formatCurrency, formatKoreanDate } from '@/utils/formatters';
import { useDirectorTodayDashboard } from './useDirectorTodayDashboard';
import { DirectorTodayAttendanceSection } from './DirectorTodayAttendanceSection';
import { DirectorTodayScheduleSection } from './DirectorTodayScheduleSection';
import { DirectorTodayTasksSection, type DirectorTodayTaskItem } from './DirectorTodayTasksSection';
import { DirectorTodayUnpaidSection } from './DirectorTodayUnpaidSection';

/** 원장 홈 — 오늘 일정·등원·미납·처리할 업무만 */
export const DirectorTodayHome: FC = () => {
  const { setActiveTab, currentUser } = useApp();
  const data = useDirectorTodayDashboard();

  const {
    stats,
    students,
    todayClasses,
    unpaidInvoices,
    unpaidTotal,
    unpaidStudentCount,
    today,
    expectedDay,
    pendingInquiryCount,
    pendingEnrollmentCount,
    pendingJoinCount,
    makeupPendingCount,
    pendingReservationCount,
  } = data;

  const isEmpty = stats.activeStudents === 0;

  const taskItems = useMemo((): DirectorTodayTaskItem[] => {
    return [
      {
        id: 'inquiry',
        label: '상담 문의',
        count: pendingInquiryCount,
        tab: 'consultations',
        tone: 'indigo',
      },
      {
        id: 'enrollment',
        label: '자녀 등록',
        count: pendingEnrollmentCount,
        tab: 'enrollment-requests',
        tone: 'amber',
      },
      {
        id: 'join',
        label: '자가가입',
        count: pendingJoinCount,
        tab: 'enrollment-requests',
        tone: 'amber',
      },
      {
        id: 'makeup',
        label: '보강 대기',
        count: makeupPendingCount,
        tab: 'makeups',
        tone: 'rose',
      },
      {
        id: 'reservation',
        label: '예약 요청',
        count: pendingReservationCount,
        tab: 'calendar',
        tone: 'emerald',
      },
    ];
  }, [
    pendingInquiryCount,
    pendingEnrollmentCount,
    pendingJoinCount,
    makeupPendingCount,
    pendingReservationCount,
  ]);

  const pendingTaskTotal = taskItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4 pb-4 max-w-5xl mx-auto w-full">
      <section className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 rounded-2xl px-4 py-3.5 text-white">
        <p className="text-[11px] text-indigo-200 font-semibold">
          {formatKoreanDate(new Date().toISOString())}
        </p>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate mt-0.5">
          안녕하세요, {currentUser.name}님
        </h2>
        <p className="text-xs text-indigo-100/90 mt-1 leading-snug">
          {isEmpty
            ? '먼저 학생을 등록한 뒤, 일정에 배치하고 출결·수납을 관리하세요.'
            : [
                todayClasses.length > 0 ? `수업 ${todayClasses.length}` : null,
                unpaidStudentCount > 0
                  ? `미납 ${unpaidStudentCount}명(${formatCurrency(unpaidTotal)})`
                  : '미납 없음',
                pendingTaskTotal > 0 ? `할 일 ${pendingTaskTotal}건` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
        </p>
        {isEmpty && (
          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className="mt-3 min-h-[44px] px-4 rounded-xl bg-white text-indigo-900 text-sm font-bold"
          >
            학생 등록하기
          </button>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DirectorTodayScheduleSection
          todayClasses={todayClasses}
          students={students}
          onOpenSchedule={() => setActiveTab('timetable')}
        />
        <DirectorTodayAttendanceSection
          today={today}
          expectedDay={expectedDay}
          onOpenAttendance={() => setActiveTab('attendance')}
        />
        <DirectorTodayUnpaidSection
          invoices={unpaidInvoices}
          onOpenUnpaid={() => setActiveTab('unpaid')}
        />
        <DirectorTodayTasksSection items={taskItems} onOpen={setActiveTab} />
      </div>
    </div>
  );
};
