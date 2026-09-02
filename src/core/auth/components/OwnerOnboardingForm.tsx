import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import type { IndustryType } from '@/core/industry/types';
import { SignupBusinessFields } from './SignupBusinessFields';
import { validateSignUpBusiness } from '../utils/validateSignup';

interface OwnerOnboardingFormProps {
  directorName: string;
  loading?: boolean;
  error?: string | null;
  onSubmit: (details: {
    industryType: IndustryType;
    businessName: string;
    phone: string;
    address: string;
    businessNumber?: string;
  }) => Promise<void>;
  onBack: () => void;
}

export function OwnerOnboardingForm({
  directorName,
  loading = false,
  error = null,
  onSubmit,
  onBack,
}: OwnerOnboardingFormProps) {
  const [industryType, setIndustryType] = useState<IndustryType>('piano');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLocalError(null);

    const details = {
      industryType,
      businessName: businessName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      businessNumber: businessNumber.trim() || undefined,
    };

    try {
      validateSignUpBusiness(details);
      await onSubmit(details);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : '사업장 정보를 확인해 주세요.');
    }
  };

  const displayError = localError ?? error;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
        <p className="text-xs text-slate-500">대표자</p>
        <p className="text-sm font-bold text-slate-900 mt-0.5">{directorName || '원장님'}</p>
      </div>

      <SignupBusinessFields
        industryType={industryType}
        businessName={businessName}
        phone={phone}
        address={address}
        businessNumber={businessNumber}
        onIndustryTypeChange={setIndustryType}
        onBusinessNameChange={setBusinessName}
        onPhoneChange={setPhone}
        onAddressChange={setAddress}
        onBusinessNumberChange={setBusinessNumber}
      />

      {displayError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-sm text-rose-700">
          {displayError}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 min-h-[44px] disabled:opacity-50"
        >
          이전
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-[1.4] py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          사업장 만들기
        </button>
      </div>
    </form>
  );
}
