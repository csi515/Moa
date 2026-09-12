import type { IndustryType } from '@/core/industry/types';
import { IndustryPicker } from '@/core/industry/IndustryPicker';
import { Building2, Phone } from 'lucide-react';
import { normalizePhoneInput } from '../utils/validateSignup';
import {
  OrganizationAddressFields,
  type OrganizationAddressValue,
} from '@/core/address';
import { getPlaceNamePlaceholder } from '@/core/industry/industryUi';

interface SignupBusinessFieldsProps {
  industryType: IndustryType;
  businessName: string;
  phone: string;
  addressParts: OrganizationAddressValue;
  businessNumber: string;
  openingDate: string;
  onIndustryTypeChange: (value: IndustryType) => void;
  onBusinessNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressPartsChange: (value: OrganizationAddressValue) => void;
  onBusinessNumberChange: (value: string) => void;
  onOpeningDateChange: (value: string) => void;
}

export function SignupBusinessFields({
  industryType,
  businessName,
  phone,
  addressParts,
  businessNumber,
  openingDate,
  onIndustryTypeChange,
  onBusinessNameChange,
  onPhoneChange,
  onAddressPartsChange,
  onBusinessNumberChange,
  onOpeningDateChange,
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
            placeholder={getPlaceNamePlaceholder(industryType)}
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

      <OrganizationAddressFields
        value={addressParts}
        onChange={onAddressPartsChange}
        required
        label="사업장 주소"
      />

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">
          사업자등록번호
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={businessNumber}
          onChange={(event) => onBusinessNumberChange(event.target.value.replace(/[^0-9-]/g, ''))}
          placeholder="1234567890"
          required
          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1.5">개업일자</label>
        <input
          type="date"
          value={openingDate}
          onChange={(event) => onOpeningDateChange(event.target.value)}
          required
          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white min-h-[44px]"
        />
      </div>
    </div>
  );
}
