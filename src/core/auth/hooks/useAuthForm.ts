import { useState, type FormEvent } from 'react';
import type { IndustryType } from '@/core/industry/types';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { useAuth } from '../AuthProvider';
import * as authService from '../services/authService';
import { validateSignUpBusiness } from '../utils/validateSignup';
import { saveOAuthSignupIntent } from '../utils/oauthSignupIntent';
import type { AccountType } from '../types/signup';

export type AuthMode = 'login' | 'signup' | 'forgot';

export function useAuthForm() {
  const { signIn, signUp, signInWithKakao } = useAuth();
  const { createOrganization } = useOrganization();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('owner');
  const [industryType, setIndustryType] = useState<IndustryType>('piano');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
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

  const handleKakao = async () => {
    setError(null);
    setInfo(null);

    try {
      if (mode === 'signup') {
        if (!agreedToTerms) {
          throw new Error('이용약관 및 개인정보처리방침에 동의해 주세요.');
        }
        if (accountType === 'owner') {
          saveOAuthSignupIntent({
            mode: 'signup',
            accountType,
            fullName: fullName.trim() || undefined,
            industryType,
            businessName: businessName.trim() || undefined,
            phone: phone.trim() || undefined,
            address: address.trim() || undefined,
            businessNumber: businessNumber.trim() || undefined,
          });
        } else {
          saveOAuthSignupIntent({
            mode: 'signup',
            accountType,
            fullName: fullName.trim() || undefined,
          });
        }
      } else if (mode === 'forgot') {
        throw new Error('비밀번호 찾기는 이메일로 진행해 주세요.');
      } else {
        saveOAuthSignupIntent({ mode: 'login' });
      }

      setLoading(true);
      await signInWithKakao();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '카카오 로그인 중 오류가 발생했습니다.';
      setError(message);
      setLoading(false);
    }
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

      if (accountType === 'owner') {
        const business = {
          industryType,
          businessName: businessName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          businessNumber: businessNumber.trim() || undefined,
        };
        validateSignUpBusiness(business);

        await signUp(email.trim(), password, fullName.trim(), accountType, business);
        await createOrganization(business.businessName, business.industryType, {
          name: business.businessName,
          directorName: fullName.trim(),
          phone: business.phone,
          address: business.address,
          businessNumber: business.businessNumber,
          features: { attendance: { enabled: false } },
        });
      } else {
        await signUp(email.trim(), password, fullName.trim(), accountType);
      }
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
    accountType,
    setAccountType,
    industryType,
    setIndustryType,
    businessName,
    setBusinessName,
    phone,
    setPhone,
    address,
    setAddress,
    businessNumber,
    setBusinessNumber,
    showPassword,
    setShowPassword,
    agreedToTerms,
    setAgreedToTerms,
    loading,
    error,
    info,
    switchMode,
    handleSubmit,
    handleKakao,
  };
}
