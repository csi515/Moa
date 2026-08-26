import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';
import { AUTH_COPY, type AuthMode } from './authUi';
import {
  assertMinPassword,
  assertNonEmpty,
  assertPasswordMatch,
} from './authValidation';

function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.';
}

/** AuthPage 폼 상태·제출 처리 */
export function useAuthPageForm() {
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
    if (!passwordRecoveryPending) return;
    setMode('update');
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
  }, [passwordRecoveryPending]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else if (mode === 'signup') {
        const name = assertNonEmpty(fullName, '이름을 입력해 주세요.');
        assertMinPassword(password);
        await signUp(email.trim(), password, name);
      } else if (mode === 'forgot') {
        const trimmedEmail = assertNonEmpty(email, '가입한 이메일을 입력해 주세요.');
        await requestPasswordReset(trimmedEmail);
        setInfo(AUTH_COPY.info.resetSent);
      } else {
        assertMinPassword(password, '새 비밀번호');
        assertPasswordMatch(password, confirmPassword);
        await updatePassword(password);
        setInfo(AUTH_COPY.info.passwordUpdated);
      }
    } catch (err) {
      setError(toErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    switchMode,
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    fullName,
    setFullName,
    showPassword,
    setShowPassword,
    loading,
    error,
    info,
    handleSubmit,
    signOut,
  };
}
