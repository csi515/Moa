import { useState, type FormEvent } from 'react';
import type { IndustryType } from '@/core/industry/types';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { useAuth } from '../AuthProvider';
import * as authService from '../services/authService';
import { validateSignUpBusiness } from '../utils/validateSignup';
import {
  assertBusinessMatches,
  consumeOwnerBusinessBlockMessage,
} from '../services/ownerBusinessGate';
import { saveOAuthSignupIntent } from '../utils/oauthSignupIntent';
import type { AccountType } from '../types/signup';

export type AuthMode = 'login' | 'signup' | 'forgot';

export function useAuthForm() {
  const { signIn, signUp, signInWithKakao, signOut } = useAuth();
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
  const [openingDate, setOpeningDate] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => consumeOwnerBusinessBlockMessage());
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
        // 카카오 가입: 약관·계정유형만 확인. 사업장 정보는 OAuth 복귀 후 마법사에서 입력
        if (!agreedToTerms) {
          throw new Error('이용약관 및 개인정보처리방침에 동의해 주세요.');
        }
        saveOAuthSignupIntent({
          mode: 'signup',
          accountType,
          fullName: fullName.trim() || undefined,
          ...(accountType === 'owner'
            ? {
                industryType,
                businessName: businessName.trim() || undefined,
                phone: phone.trim() || undefined,
                address: address.trim() || undefined,
                businessNumber: businessNumber.trim() || undefined,
                openingDate: openingDate.trim() || undefined,
              }
            : {}),
        });
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
    } finally {
      // OAuth 리다이렉트가 실패·차단되면 버튼을 다시 활성화
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
          openingDate: openingDate.trim() || undefined,
        };
        validateSignUpBusiness(business);

        await signUp(email.trim(), password, fullName.trim(), accountType, business);
        try {
          await assertBusinessMatches({
            businessNumber: business.businessNumber || '',
            representativeName: fullName.trim(),
            openingDate: business.openingDate || '',
            businessName: business.businessName,
          });
        } catch (gateError) {
          await signOut();
          throw gateError;
        }
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
    openingDate,
    setOpeningDate,
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
