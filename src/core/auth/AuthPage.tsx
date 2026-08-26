import React from 'react';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import {
  AUTH_COPY,
  AUTH_INPUT_CLASS,
  AUTH_LINK_BUTTON_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
  MIN_PASSWORD_LENGTH,
} from './authUi';
import { useAuthPageForm } from './useAuthPageForm';
import { AuthShell } from './components/AuthShell';
import { AuthPageHeader } from './components/AuthPageHeader';
import { AuthModeTabs } from './components/AuthModeTabs';
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
      className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg touch-manipulation"
      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const handleBack =
    mode === 'forgot'
      ? () => switchMode('login')
      : mode === 'update'
        ? () => void signOut()
        : undefined;

  return (
    <AuthShell>
      <AuthPageHeader mode={mode} onBack={handleBack} />

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-8 lg:shadow-lg">
        {(mode === 'login' || mode === 'signup') && (
          <AuthModeTabs mode={mode} onChange={switchMode} />
        )}

        {(mode === 'forgot' || mode === 'update') && (
          <div className="mb-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{AUTH_COPY.heading[mode]}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              {AUTH_COPY.description[mode]}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
          {mode === 'signup' && (
            <AuthFormField
              label="이름"
              icon={User}
              value={form.fullName}
              onChange={form.setFullName}
              placeholder="홍길동"
              autoComplete="name"
              name="fullName"
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
              inputMode="email"
              name="email"
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
              name="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              inputClassName={`${AUTH_INPUT_CLASS} pr-12`}
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
              name="confirmPassword"
              required
              minLength={MIN_PASSWORD_LENGTH}
            />
          )}

          <AuthFeedback error={error} info={info} />

          <button type="submit" disabled={loading} className={AUTH_PRIMARY_BUTTON_CLASS}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            {AUTH_COPY.submit[mode]}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-4 pt-1 text-center border-t border-slate-100">
            <button
              type="button"
              onClick={() => switchMode('forgot')}
              className={AUTH_LINK_BUTTON_CLASS}
            >
              {AUTH_COPY.forgotLink}
            </button>
          </div>
        )}

        {mode === 'forgot' && (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`${AUTH_LINK_BUTTON_CLASS} mt-4 w-full text-slate-600 hover:text-slate-800 hidden lg:inline-flex`}
          >
            {AUTH_COPY.backToLogin}
          </button>
        )}

        {mode === 'update' && (
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 w-full text-sm font-semibold text-slate-500 hover:text-slate-700 min-h-[44px] touch-manipulation hidden lg:block"
          >
            {AUTH_COPY.switchAccount}
          </button>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-5 sm:mt-6 leading-relaxed px-4">
        {AUTH_COPY.footer}
      </p>
    </AuthShell>
  );
};
