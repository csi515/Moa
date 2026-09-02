import { useState, type FormEvent } from 'react';
import { useAuth } from '../AuthProvider';
import * as authService from '../services/authService';

export type AuthMode = 'login' | 'signup' | 'forgot';

export function useAuthForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await authService.resetPassword(email);
        setInfo('비밀번호 재설정 링크를 이메일로 보냈습니다. 받은편지함을 확인해 주세요.');
        return;
      }

      if (mode === 'login') {
        await signIn(email.trim(), password);
        return;
      }

      if (!fullName.trim()) {
        throw new Error('이름을 입력해 주세요.');
      }
      if (password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      }
      if (!agreedToTerms) {
        throw new Error('이용약관 및 개인정보처리방침에 동의해 주세요.');
      }

      await signUp(email.trim(), password, fullName.trim());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '인증 처리 중 오류가 발생했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    showPassword,
    setShowPassword,
    agreedToTerms,
    setAgreedToTerms,
    loading,
    error,
    info,
    switchMode,
    handleSubmit,
  };
}
