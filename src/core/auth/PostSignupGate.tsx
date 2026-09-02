import { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { appBrand } from '@/core/brand';
import { ensureGlobalParentProfile } from '@/core/parent/services/parentPortalService';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { useAuth } from './AuthProvider';
import { AccountTypeSelection } from './components/AccountTypeSelection';
import { OwnerOnboardingForm } from './components/OwnerOnboardingForm';
import * as authService from './services/authService';

type OnboardingStep = 'choose' | 'owner' | 'parent';

export function PostSignupGate() {
  const { user } = useAuth();
  const { createOrganization, enterParentPortal, refreshOrganizations } = useOrganization();
  const [step, setStep] = useState<OnboardingStep>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const directorName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email?.split('@')[0] ||
    '원장님';

  const completeParentOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureGlobalParentProfile();
      await authService.updateAccountType('parent');
      enterParentPortal();
      await refreshOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : '학부모 설정에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleSelectParent = () => {
    setStep('parent');
    void completeParentOnboarding();
  };

  const handleOwnerSubmit = async (details: {
    industryType: import('@/core/industry/types').IndustryType;
    businessName: string;
    phone: string;
    address: string;
    businessNumber?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await createOrganization(details.businessName, details.industryType, {
        name: details.businessName,
        directorName,
        phone: details.phone,
        address: details.address,
        businessNumber: details.businessNumber,
      });
      await authService.updateAccountType('owner');
      await refreshOrganizations();
    } catch (err) {
      setError(err instanceof Error ? err.message : '사업장 생성에 실패했습니다.');
      setLoading(false);
    }
  };

  const title =
    step === 'choose'
      ? '어떻게 이용하시나요?'
      : step === 'owner'
        ? '사업장 정보를 입력해 주세요'
        : '학부모 포털 준비 중';

  const description =
    step === 'choose'
      ? '가입을 환영합니다. 이용 목적에 맞는 메뉴로 안내해 드립니다.'
      : step === 'owner'
        ? '운영하실 사업장 정보를 등록하면 바로 시작할 수 있습니다.'
        : '잠시만 기다려 주세요. 학부모 메뉴로 이동합니다.';

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl text-white shadow-lg mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{appBrand.shortName}</h1>
          <p className="text-sm text-slate-500 mt-2">{description}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>

          {step === 'choose' && <AccountTypeSelection onSelect={(type) => {
            if (type === 'parent') {
              handleSelectParent();
              return;
            }
            setStep('owner');
          }} />}

          {step === 'owner' && (
            <OwnerOnboardingForm
              directorName={directorName}
              loading={loading}
              error={error}
              onSubmit={handleOwnerSubmit}
              onBack={() => {
                setStep('choose');
                setError(null);
              }}
            />
          )}

          {step === 'parent' && (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-600">학부모 포털을 준비하고 있습니다.</p>
              {error && (
                <div className="w-full p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
