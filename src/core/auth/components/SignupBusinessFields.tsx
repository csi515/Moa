import type { IndustryType } from '@/core/industry/types';
import { IndustryPicker } from '@/core/industry/IndustryPicker';
import { Building2, MapPin, Phone } from 'lucide-react';
import { normalizePhoneInput } from '../utils/validateSignup';

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
        <IndustryPicker
          value={industryType}
          onChange={onIndustryTypeChange}
          variant="compact"
        />
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
