import type { ComponentType } from 'react';
import type { IndustryType } from '@/core/industry/types';
import { INDUSTRY_OPTIONS } from '@/core/industry/types';
import {
  Activity,
  Baby,
  Building2,
  Dumbbell,
  MapPin,
  Phone,
  Piano,
} from 'lucide-react';
import { normalizePhoneInput } from '../utils/validateSignup';

const INDUSTRY_ICONS: Record<IndustryType, ComponentType<{ className?: string }>> = {
  piano: Piano,
  pilates: Activity,
  gym: Dumbbell,
  daycare: Baby,
};

interface SignupBusinessFieldsProps {
  industryType: IndustryType;
  businessName: string;
  phone: string;
  address: string;
  businessNumber: string;
  onIndustryTypeChange: (value: IndustryType) => void;
  onBusinessNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onBusinessNumberChange: (value: string) => void;
}

export function SignupBusinessFields({
  industryType,
  businessName,
  phone,
  address,
  businessNumber,
  onIndustryTypeChange,
  onBusinessNameChange,
  onPhoneChange,
  onAddressChange,
  onBusinessNumberChange,
}: SignupBusinessFieldsProps) {
  return (
    <div className="space-y-4 pt-1 border-t border-slate-100">
      <p className="text-xs font-bold text-slate-500">사업장 정보</p>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">운영 업종</label>
        <div className="grid grid-cols-1 gap-2">
          {INDUSTRY_OPTIONS.map((option) => {
            const Icon = INDUSTRY_ICONS[option.value];
            const selected = industryType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onIndustryTypeChange(option.value)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left min-h-[44px] transition-colors ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-bold block">{option.label}</span>
                  <span className="text-[11px] text-slate-500">{option.description}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">사업장 이름</label>
        <div className="relative">
          <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={businessName}
            onChange={(event) => onBusinessNameChange(event.target.value)}
            placeholder="하모니 피아노 음악학원"
            autoComplete="organization"
            className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">대표자 휴대폰</label>
        <div className="relative">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(event) => onPhoneChange(normalizePhoneInput(event.target.value))}
            placeholder="01012345678"
            autoComplete="tel"
            maxLength={11}
            className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">사업장 주소</label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <textarea
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder="도로명 주소, 상세 주소"
            rows={2}
            autoComplete="street-address"
            className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">
          사업자등록번호 <span className="font-normal text-slate-400">(선택)</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={businessNumber}
          onChange={(event) => onBusinessNumberChange(event.target.value.replace(/[^0-9-]/g, ''))}
          placeholder="123-45-67890"
          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
        />
      </div>
    </div>
  );
}
