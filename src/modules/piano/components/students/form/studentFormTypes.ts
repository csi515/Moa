import type { GuardianRelationship } from '@/core/parent/types';
import type { StudentLevel, StudentStatus } from '@/types';

export interface GuardianFormEntry {
  key: string;
  mode: 'existing' | 'new';
  existingParentId: string;
  parentSearch: string;
  name: string;
  phone: string;
  email: string;
  relationship: GuardianRelationship;
  isPrimary: boolean;
  invite: boolean;
}

export interface StudentFormData {
  name: string;
  gender: 'M' | 'F';
  birthDate: string;
  phone: string;
  school: string;
  grade: string;
  joinDate: string;
  leaveDate: string;
  status: StudentStatus;
  teacherId: string;
  classIds: string[];
  level: StudentLevel;
  tuitionFee: number;
  paymentDay: number;
  specialNotes: string;
  memo: string;
  checkInPin: string;
  autoGeneratePin: boolean;
}

export const LEVEL_OPTIONS: StudentLevel[] = [
  '바이엘 상', '바이엘 하', '체르니 100', '체르니 30', '체르니 40',
  '체르니 50', '소나티네/명곡', '작품집/쇼팽', '입시/콩쿠르', '성인 취미',
];

export const RELATIONSHIP_OPTIONS: GuardianRelationship[] = ['father', 'mother', 'other'];

export function newGuardianEntry(primary = false): GuardianFormEntry {
  return {
    key: crypto.randomUUID(),
    mode: 'new',
    existingParentId: '',
    parentSearch: '',
    name: '',
    phone: '',
    email: '',
    relationship: 'mother',
    isPrimary: primary,
    invite: false,
  };
}
