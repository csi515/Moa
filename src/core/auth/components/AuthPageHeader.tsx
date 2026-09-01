import { ArrowLeft, KeyRound, Music } from 'lucide-react';
import type { AuthMode } from '../authUi';
import { AUTH_COPY } from '../authUi';

/** 로그인 화면 상단 (모바일 백 버튼 + 브랜드) */
export function AuthPageHeader({
  mode,
  onBack,
}: {
  mode: AuthMode;
  onBack?: () => void;
}) {
  const showBack = (mode === 'forgot' || mode === 'update') && onBack;
  const Icon = mode === 'forgot' || mode === 'update' ? KeyRound : Music;

  return (
    <header className="mb-6 sm:mb-8">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 min-h-[44px] -ml-1 px-1 touch-manipulation lg:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          {mode === 'forgot' ? AUTH_COPY.backToLogin : '로그인'}
        </button>
      )}

      <div className="text-center lg:text-left">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4 lg:hidden">
          <Icon className="w-7 h-7" aria-hidden />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{AUTH_COPY.title}</h1>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed px-2 sm:px-0">
          {AUTH_COPY.subtitle[mode]}
        </p>
      </div>
    </header>
  );
}
