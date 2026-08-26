import React from 'react';
import {
  Music,
  Mail,
  Lock,
  User,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { AUTH_COPY, AUTH_INPUT_CLASS, MIN_PASSWORD_LENGTH } from './authUi';
import { useAuthPageForm } from './useAuthPageForm';
import { AuthFormField } from './components/AuthFormField';
import { AuthFeedback } from './components/AuthFeedback';

export const AuthPage: React.FC = () => {
  const form = useAuthPageForm();
  const { mode, switchMode, showPassword, setShowPassword, loading, error, info, handleSubmit, signOut } =
    form;

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
            {mode === 'forgot' || mode === 'update' ? (
              <KeyRound className="w-7 h-7" />
            ) : (
              <Music className="w-7 h-7" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{AUTH_COPY.title}</h1>
          <p className="text-sm text-slate-500 mt-2">{AUTH_COPY.subtitle[mode]}</p>
        </header>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              {(['login', 'signup'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchMode(tab)}
                  className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors min-h-[44px] ${
                    mode === tab
                      ? 'bg-white text-indigo-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>
          )}

          {(mode === 'forgot' || mode === 'update') && (
            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-900">{AUTH_COPY.heading[mode]}</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {AUTH_COPY.description[mode]}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <AuthFormField
                label="이름"
                icon={User}
                value={form.fullName}
                onChange={form.setFullName}
                placeholder="홍길동"
                autoComplete="name"
              />
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <AuthFormField
                label="이메일"
                icon={Mail}
                type="email"
                value={form.email}
                onChange={form.setEmail}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'update') && (
              <AuthFormField
                label={mode === 'update' ? '새 비밀번호' : '비밀번호'}
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={form.setPassword}
                placeholder={mode === 'login' ? '비밀번호' : '6자 이상'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                minLength={MIN_PASSWORD_LENGTH}
                inputClassName={`${AUTH_INPUT_CLASS} pr-11`}
                trailing={passwordToggle}
              />
            )}

            {mode === 'update' && (
              <AuthFormField
                label="새 비밀번호 확인"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={form.setConfirmPassword}
                placeholder="비밀번호 다시 입력"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            )}

            <AuthFeedback error={error} info={info} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {AUTH_COPY.submit[mode]}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 min-h-[44px] px-2"
              >
                {AUTH_COPY.forgotLink}
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              {AUTH_COPY.backToLogin}
            </button>
          )}

          {mode === 'update' && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 w-full text-sm font-semibold text-slate-500 hover:text-slate-700 min-h-[44px]"
            >
              {AUTH_COPY.switchAccount}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">{AUTH_COPY.footer}</p>
      </div>
    </div>
  );
};
