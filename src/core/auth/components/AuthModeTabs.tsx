import type { AuthMode } from '../authUi';

/** 로그인 / 회원가입 탭 */
export function AuthModeTabs({
  mode,
  onChange,
}: {
  mode: AuthMode;
  onChange: (mode: 'login' | 'signup') => void;
}) {
  return (
    <div
      className="flex rounded-xl bg-slate-100 p-1 mb-6"
      role="tablist"
      aria-label="로그인 방식"
    >
      {(['login', 'signup'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={mode === tab}
          onClick={() => onChange(tab)}
          className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors min-h-[48px] touch-manipulation ${
            mode === tab
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab === 'login' ? '로그인' : '회원가입'}
        </button>
      ))}
    </div>
  );
}
