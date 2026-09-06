import type { OrganizationAddressValue } from './types';

type AddressDisplayParts = Partial<OrganizationAddressValue> & {
  businessAddress?: string | null;
  address?: string | null;
};

/** 표시용 주소 문자열. 필드는 분리 저장하고 표시만 조합한다. */
export function formatOrganizationAddress(parts: AddressDisplayParts): string {
  const road = parts.roadAddress?.trim() || '';
  const detail = parts.addressDetail?.trim() || '';
  if (road) {
    return detail ? `${road} ${detail}` : road;
  }
  return (parts.businessAddress || parts.address || '').trim();
}
