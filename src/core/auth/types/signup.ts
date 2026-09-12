import type { IndustryType } from '@/core/industry/types';
import type { OrganizationAddressValue } from '@/core/address';

export type AccountType = 'owner' | 'teacher' | 'parent';

export interface SignUpBusinessDetails {
  industryType: IndustryType;
  businessName: string;
  phone: string;
  /** 표시·레거시용 조합 주소 */
  address: string;
  /** 구조화 주소 (org columns) */
  addressParts: OrganizationAddressValue;
  businessNumber?: string;
  openingDate?: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  accountType: AccountType;
  business?: SignUpBusinessDetails;
}
