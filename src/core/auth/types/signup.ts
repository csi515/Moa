import type { IndustryType } from '@/core/industry/types';

export type AccountType = 'owner' | 'teacher' | 'parent';

export interface SignUpBusinessDetails {
  industryType: IndustryType;
  businessName: string;
  phone: string;
  address: string;
  businessNumber?: string;
}

export interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
  accountType: AccountType;
  business?: SignUpBusinessDetails;
}
