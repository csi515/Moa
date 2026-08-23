import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { downloadStoreBackupFile } from '@/core/backup';
import {
  Plus,
  UserPlus,
  CreditCard,
  CheckSquare,
  Receipt,
  BookOpen,
  TrendingUp,
  Download,
} from 'lucide-react';

export const DirectorFloatingFab: React.FC = () => {
  const { setActiveTab, showToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (tab: Parameters<typeof setActiveTab>[0]) => {
    setActiveTab(tab);
    setIsOpen(false);
  };

  const handleBackup = () => {
    try {
      const { fileName } = downloadStoreBackupFile();
      showToast(`백업 파일이 컴퓨터에 저장되었습니다. (${fileName})`, 'success');
    } catch {
      showToast('백업 다운로드에 실패했습니다.', 'error');
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 flex flex-col items-end pointer-events-auto">
      {isOpen && (
        <div className="mb-3 flex flex-col items-end gap-2 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg mb-1">
            ⚡ 빠른 실행 메뉴
          </div>

          <button
            type="button"
            onClick={handleBackup}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 font-bold text-xs rounded-2xl shadow-lg border border-slate-100 hover:bg-emerald-50 hover:text-emerald-700 transition-all active:scale-95"
          >
            <span>매장 백업 다운로드</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction('students')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 font-bold text-xs rounded-2xl shadow-lg border border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
          >
            <span>신규 원생 등록</span>
            <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction('tuition')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 font-bold text-xs rounded-2xl shadow-lg border border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
          >
            <span>수강료/교재 수납</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction('attendance')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 font-bold text-xs rounded-2xl shadow-lg border border-slate-100 hover:bg-teal-50 hover:text-teal-600 transition-all active:scale-95"
          >
            <span>오늘 출결 체크</span>
            <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction('textbooks')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 font-bold text-xs rounded-2xl shadow-lg border border-slate-100 hover:bg-amber-50 hover:text-amber-600 transition-all active:scale-95"
          >
            <span>교재 판매/재고</span>
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction('income')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 font-bold text-xs rounded-2xl shadow-lg border border-slate-100 hover:bg-emerald-50 hover:text-emerald-600 transition-all active:scale-95"
          >
            <span>수입 등록</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleAction('expenses')}
            className="flex items-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 font-bold text-xs rounded-2xl shadow-lg border border-slate-100 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
          >
            <span>지출 등록</span>
            <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="빠른 실행 메뉴"
        className={`w-14 h-14 sm:w-14 sm:h-14 min-h-[56px] min-w-[56px] rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-90 ${
          isOpen
            ? 'bg-slate-800 text-white rotate-45 scale-95'
            : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white hover:from-indigo-700 hover:to-indigo-600 hover:scale-105 shadow-indigo-500/30'
        }`}
      >
        <Plus className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} />
      </button>
    </div>
  );
};
