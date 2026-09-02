import type { IndustryType } from '@/core/industry/types';

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
  business: SignUpBusinessDetails;
}
