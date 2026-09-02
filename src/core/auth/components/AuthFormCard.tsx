import type { FormEvent } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import type { IndustryType } from '@/core/industry/types';
import { legalPageHref } from '@/core/legal/legalPaths';
import { SignupBusinessFields } from './SignupBusinessFields';
import type { AuthMode } from '../hooks/useAuthForm';

interface AuthFormCardProps {
  mode: AuthMode;
  email: string;
  password: string;
  fullName: string;
  industryType: IndustryType;
  businessName: string;
  phone: string;
  address: string;
  businessNumber: string;
  showPassword: boolean;
  agreedToTerms: boolean;
  loading: boolean;
  error: string | null;
  info: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFullNameChange: (value: string) => void;
  onIndustryTypeChange: (value: IndustryType) => void;
  onBusinessNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onBusinessNumberChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onAgreedToTermsChange: (value: boolean) => void;
  onSwitchMode: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent) => void;
}

export function AuthFormCard({
  mode,
  email,
  password,
  fullName,
  industryType,
  businessName,
  phone,
  address,
  businessNumber,
  showPassword,
  agreedToTerms,
  loading,
  error,
  info,
  onEmailChange,
  onPasswordChange,
  onFullNameChange,
  onIndustryTypeChange,
  onBusinessNameChange,
  onPhoneChange,
  onAddressChange,
  onBusinessNumberChange,
  onShowPasswordToggle,
  onAgreedToTermsChange,
  onSwitchMode,
  onSubmit,
}: AuthFormCardProps) {
  return (
    <>
      {mode !== 'forgot' && (
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => onSwitchMode('login')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors min-h-[44px] ${
              mode === 'login'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => onSwitchMode('signup')}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors min-h-[44px] ${
              mode === 'signup'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            회원가입
          </button>
        </div>
      )}

      {mode === 'forgot' && (
        <button
          type="button"
          onClick={() => onSwitchMode('login')}
          className="text-xs font-bold text-indigo-600 mb-4 min-h-[44px]"
        >
          ← 로그인으로 돌아가기
        </button>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">대표자 이름</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={fullName}
                onChange={(event) => onFullNameChange(event.target.value)}
                placeholder="홍길동"
                autoComplete="name"
                className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5">이메일</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
              className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-600">비밀번호</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => onSwitchMode('forgot')}
                  className="text-xs font-bold text-indigo-600 min-h-[44px] px-1"
                >
                  비밀번호 찾기
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                placeholder={mode === 'signup' ? '6자 이상' : '비밀번호'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
                className="w-full pl-10 pr-11 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
              />
              <button
                type="button"
                onClick={onShowPasswordToggle}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <SignupBusinessFields
            industryType={industryType}
            businessName={businessName}
            phone={phone}
            address={address}
            businessNumber={businessNumber}
            onIndustryTypeChange={onIndustryTypeChange}
            onBusinessNameChange={onBusinessNameChange}
            onPhoneChange={onPhoneChange}
            onAddressChange={onAddressChange}
            onBusinessNumberChange={onBusinessNumberChange}
          />
        )}

        {mode === 'signup' && (
          <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(event) => onAgreedToTermsChange(event.target.checked)}
              className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>
              <a href={legalPageHref('terms')} className="text-indigo-600 underline">
                이용약관
              </a>
              과{' '}
              <a href={legalPageHref('privacy')} className="text-indigo-600 underline">
                개인정보처리방침
              </a>
              에 동의합니다 (필수)
            </span>
          </label>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
            {error}
          </div>
        )}

        {info && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-800">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' && '로그인'}
          {mode === 'signup' && '가입하고 시작하기'}
          {mode === 'forgot' && '재설정 링크 보내기'}
        </button>
      </form>
    </>
  );
}
