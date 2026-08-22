import React, { useEffect, useState } from 'react';
import { StorageService } from '@/services/storage';

interface KioskLayoutProps {
  children: React.ReactNode;
  /** 관리자 화면으로 나가기 (OS 홈/뒤로가기 차단에 의존하지 않음) */
  onExit?: () => void;
  academyName?: string;
}

/**
 * 전용 키오스크 레이아웃 — Header/Sidebar/BottomNav 없음
 * Android COSU / iPad Guided Access / MDM과 함께 사용
 */
export const KioskLayout: React.FC<KioskLayoutProps> = ({
  children,
  onExit,
  academyName,
}) => {
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const displayName = academyName || StorageService.getSettings().name || '출결 키오스크';

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-slate-100 to-slate-200 text-slate-900 selection:bg-indigo-500 selection:text-white">
      <header className="shrink-0 px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">출결 키오스크</p>
          <h1 className="text-sm sm:text-base font-black truncate">{displayName}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <time className="text-xs font-mono font-bold text-slate-500 tabular-nums">{clock}</time>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="px-3 py-2 min-h-[44px] text-[11px] font-bold text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95"
            >
              관리자
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">
        {children}
      </main>

      <footer className="shrink-0 py-2 text-center text-[10px] text-slate-400">
        PIN을 입력하고 확인을 눌러 주세요
      </footer>
    </div>
  );
};

function formatClock(d: Date): string {
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}
