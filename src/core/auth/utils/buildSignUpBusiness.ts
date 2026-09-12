import type { IndustryType } from '@/core/industry/types';
import {
  formatOrganizationAddress,
  type OrganizationAddressValue,
} from '@/core/address';
import type { SignUpBusinessDetails } from '../types/signup';

/** 원장 가입 폼 → SignUpBusinessDetails (표시용 address + 구조화 parts) */
export function buildSignUpBusinessDetails(input: {
  industryType: IndustryType;
  businessName: string;
  phone: string;
  addressParts: OrganizationAddressValue;
  businessNumber?: string;
  openingDate?: string;
}): SignUpBusinessDetails {
  const addressParts = input.addressParts;
  return {
    industryType: input.industryType,
    businessName: input.businessName.trim(),
    phone: input.phone.trim(),
    address: formatOrganizationAddress(addressParts),
    addressParts,
    businessNumber: input.businessNumber?.trim() || undefined,
    openingDate: input.openingDate?.trim() || undefined,
  };
}
