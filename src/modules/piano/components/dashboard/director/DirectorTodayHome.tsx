import type { FC } from 'react';
import type { NavTab } from '@/context/AppContext';
import { formatCurrency, formatKoreanDate } from '@/utils/formatters';
import { Users } from 'lucide-react';
import type { useDirectorTodayDashboard } from './useDirectorTodayDashboard';
import { DirectorTodayAttendanceSection } from './DirectorTodayAttendanceSection';
import { DirectorTodayStampSection } from './DirectorTodayStampSection';
import { DirectorTodayUnpaidSection } from './DirectorTodayUnpaidSection';

type TodayData = ReturnType<typeof useDirectorTodayDashboard>;

interface DirectorTodayHomeProps {
  currentUserName: string;
  data: TodayData;
  setActiveTab: (tab: NavTab) => void;
}

/** 원장 홈 — 오늘 할 일(등원·완곡승인·미납) 한 단 */
export const DirectorTodayHome: FC<DirectorTodayHomeProps> = ({
  currentUserName,
  data,
  setActiveTab,
}) => {
  const { stats, unpaidTotal } = data;
  const isEmpty = stats.activeStudents === 0;

  return (
    <div className="space-y-4 pb-4 max-w-2xl mx-auto w-full">
      <section className="bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-900 rounded-2xl px-4 py-3.5 text-white">
        <p className="text-[11px] text-indigo-200 font-semibold">
          {formatKoreanDate(new Date().toISOString())}
        </p>
        <h2 className="text-lg font-bold tracking-tight truncate mt-0.5">
          안녕하세요, {currentUserName}님
        </h2>
        <p className="text-xs text-indigo-100/90 mt-1">
          {isEmpty
            ? '학생을 등록하면 오늘의 원생 현황이 표시됩니다.'
            : `오늘 할 일만 처리하세요. 미납 ${formatCurrency(unpaidTotal)}`}
        </p>
        <p className="text-[10px] text-indigo-200/80 mt-2">
          레슨·출결·수납 전체 메뉴는 하단·더보기에서 열 수 있습니다.
        </p>
      </section>

      <DirectorTodayAttendanceSection onOpenAttendance={() => setActiveTab('attendance')} />
      <DirectorTodayStampSection onOpenHub={() => setActiveTab('song-stamps')} />
      <DirectorTodayUnpaidSection onOpenUnpaid={() => setActiveTab('unpaid')} />

      <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium px-1">
        <Users className="w-3.5 h-3.5" />
        재원 {stats.activeStudents}명
      </p>
    </div>
  );
};
