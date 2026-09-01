import React from 'react';
import { CalendarCheck, Sparkles, UserPlus } from 'lucide-react';
import { formatKoreanDate } from '@/utils/formatters';
import type { NavTab } from '@/context/AppContext';

interface DashboardWelcomeSectionProps {
  userName: string;
  todayClassesCount: number;
  activeStudents: number;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardWelcomeSection: React.FC<DashboardWelcomeSectionProps> = ({
  userName,
  todayClassesCount,
  activeStudents,
  onNavigate,
}) => (
  <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 bg-white/10 text-indigo-200 text-xs font-semibold rounded-full backdrop-blur-xs flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            오늘의 학원 브리핑
          </span>
          <span className="text-xs text-indigo-300 font-medium">
            {formatKoreanDate(new Date().toISOString())}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          안녕하세요, {userName}! 🎹
        </h2>
        <p className="text-sm text-indigo-200 mt-2 max-w-2xl leading-relaxed">
          오늘 예정된 수업은 <strong className="text-white underline">{todayClassesCount}개 반</strong>이며,
          재원생 <strong className="text-white">{activeStudents}명</strong>이 즐겁게 피아노를 배우고 있습니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => onNavigate('attendance')}
          className="px-4 py-2.5 bg-white text-indigo-900 font-bold text-xs sm:text-sm rounded-xl hover:bg-indigo-50 transition-all shadow-md flex items-center gap-2 cursor-pointer min-h-[44px]"
        >
          <CalendarCheck className="w-4 h-4 text-indigo-600" />
          오늘 출결 체크
        </button>
        <button
          type="button"
          onClick={() => onNavigate('students')}
          className="px-4 py-2.5 bg-indigo-600/60 hover:bg-indigo-600 text-white font-semibold text-xs sm:text-sm rounded-xl border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
        >
          <UserPlus className="w-4 h-4" />
          신규 원생 등록
        </button>
      </div>
    </div>
  </div>
);
