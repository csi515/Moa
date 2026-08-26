import React, { useEffect, useState } from 'react';
import { Music, Mail, Lock, User, Loader2, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import { useAuth } from './AuthProvider';

type AuthMode = 'login' | 'signup' | 'forgot' | 'update';

const INPUT_CLASS =
  'w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white';

export const AuthPage: React.FC = () => {
  const {
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    passwordRecoveryPending,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(passwordRecoveryPending ? 'update' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (passwordRecoveryPending) {
      setMode('update');
      setError(null);
      setInfo(null);
      setPassword('');
      setConfirmPassword('');
    }
  }, [passwordRecoveryPending]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else if (mode === 'signup') {
        if (!fullName.trim()) throw new Error('이름을 입력해 주세요.');
        if (password.length < 6) throw new Error('비밀번호는 6자 이상이어야 합니다.');
        await signUp(email.trim(), password, fullName.trim());
      } else if (mode === 'forgot') {
        if (!email.trim()) throw new Error('가입한 이메일을 입력해 주세요.');
        await requestPasswordReset(email.trim());
        setInfo(
          '비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.'
        );
      } else {
        if (password.length < 6) throw new Error('새 비밀번호는 6자 이상이어야 합니다.');
        if (password !== confirmPassword) throw new Error('비밀번호 확인이 일치하지 않습니다.');
        await updatePassword(password);
        setInfo('비밀번호가 변경되었습니다. 서비스를 이용할 수 있습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const subtitle =
    mode === 'login'
      ? '계정으로 로그인하세요'
      : mode === 'signup'
        ? '새 계정을 만들어 시작하세요'
        : mode === 'forgot'
          ? '가입 이메일로 재설정 링크를 보냅니다'
          : '새 비밀번호를 설정해 주세요';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
            {mode === 'forgot' || mode === 'update' ? (
              <KeyRound className="w-7 h-7" />
            ) : (
              <Music className="w-7 h-7" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">학원 관리 시스템</h1>
          <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode('login')}
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
                onClick={() => switchMode('signup')}
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

          {(mode === 'forgot' || mode === 'update') && (
            <div className="mb-6">
              <h2 className="text-base font-bold text-slate-900">
                {mode === 'forgot' ? '비밀번호 찾기' : '새 비밀번호 설정'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {mode === 'forgot'
                  ? '가입 시 사용한 이메일을 입력하면 재설정 링크를 보내 드립니다.'
                  : '메일 링크로 확인되었습니다. 아래에서 새 비밀번호를 입력하세요.'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">이름</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="홍길동"
                    autoComplete="name"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">이메일</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    required
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            )}

            {(mode === 'login' || mode === 'signup' || mode === 'update') && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  {mode === 'update' ? '새 비밀번호' : '비밀번호'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? '비밀번호' : '6자 이상'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    className={`${INPUT_CLASS} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'update' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">
                  새 비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
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
              {mode === 'login'
                ? '로그인'
                : mode === 'signup'
                  ? '회원가입'
                  : mode === 'forgot'
                    ? '재설정 메일 보내기'
                    : '비밀번호 변경'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 min-h-[44px] px-2"
              >
                비밀번호를 잊으셨나요?
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
              로그인으로 돌아가기
            </button>
          )}

          {mode === 'update' && (
            <button
              type="button"
              onClick={() => void signOut()}
              className="mt-4 w-full text-sm font-semibold text-slate-500 hover:text-slate-700 min-h-[44px]"
            >
              다른 계정으로 로그인
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          로그인하면 해당 Organization의 데이터만 접근할 수 있습니다.
        </p>
      </div>
    </div>
  );
};
