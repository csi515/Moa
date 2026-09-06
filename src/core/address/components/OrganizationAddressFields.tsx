import { useState, type FC } from 'react';
import { Search } from 'lucide-react';
import { FormField, FORM_CONTROL_CLASS } from '@/shared/components/ui';
import { AddressSearchModal } from './AddressSearchModal';
import type { AddressSearchResult, OrganizationAddressValue } from '../types';

interface OrganizationAddressFieldsProps {
  value: OrganizationAddressValue;
  onChange: (next: OrganizationAddressValue) => void;
  /** 레거시 단일 주소 문자열이 있고 도로명이 비어 있을 때 안내 */
  legacyAddress?: string;
  required?: boolean;
  label?: string;
}

export const OrganizationAddressFields: FC<OrganizationAddressFieldsProps> = ({
  value,
  onChange,
  legacyAddress,
  required = false,
  label = '학원 주소',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasRoad = value.roadAddress.trim().length > 0;
  const showLegacyHint = !hasRoad && Boolean(legacyAddress?.trim());

  const handleSelect = (result: AddressSearchResult) => {
    onChange({
      roadAddress: result.roadAddress,
      addressDetail: value.addressDetail,
      postal: result.postal,
      sido: result.sido,
      sigungu: result.sigungu,
      dong: result.dong,
      jibun: result.jibun,
    });
  };

  return (
    <div className="space-y-3">
      <FormField label={label} required={required}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={value.roadAddress}
              placeholder="도로명 주소 검색"
              className={`${FORM_CONTROL_CLASS} flex-1 bg-slate-50`}
              aria-label="선택한 도로명 주소"
            />
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl min-h-[44px] min-w-[44px] shrink-0"
            >
              <Search className="w-4 h-4" aria-hidden />
              <span className="hidden sm:inline">검색</span>
            </button>
          </div>
          {showLegacyHint && (
            <p className="text-xs text-slate-500 leading-relaxed">
              기존 주소: {legacyAddress}. 검색으로 다시 선택하면 지역 정보가 저장됩니다.
            </p>
          )}
        </div>
      </FormField>

      <FormField label="상세주소 (선택)">
        <input
          type="text"
          value={value.addressDetail}
          onChange={(e) => onChange({ ...value, addressDetail: e.target.value })}
          disabled={!hasRoad}
          placeholder={hasRoad ? '예: 3층 301호' : '도로명 주소를 먼저 선택해 주세요'}
          className={`${FORM_CONTROL_CLASS} disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label="상세주소"
        />
      </FormField>

      <AddressSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
      />
    </div>
  );
};
