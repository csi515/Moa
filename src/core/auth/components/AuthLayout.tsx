import type { ReactNode } from 'react';
import { GraduationCap } from 'lucide-react';
import { appBrand } from '@/core/brand';
import { LegalLinks } from '@/core/legal';
import type { AuthMode } from '../hooks/useAuthForm';

interface AuthLayoutProps {
  mode: AuthMode;
  children: ReactNode;
}

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  const subtitle =
    mode === 'login'
      ? appBrand.tagline
      : mode === 'signup'
        ? '새 계정을 만들어 시작하세요'
        : '가입한 이메일로 재설정 링크를 보내드립니다';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{appBrand.fullName}</h1>
          <p className="text-sm text-slate-500 mt-2">{subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
          {children}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          계정은 소속 학원(Organization) 데이터만 접근할 수 있습니다.
        </p>
        <div className="mt-4">
          <LegalLinks />
        </div>
      </div>
    </div>
  );
}
