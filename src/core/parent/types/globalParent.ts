import type { GuardianRelationship } from '../types';

/** 학원 등록 상태 */
export type EnrollmentStatus = 'active' | 'leave' | 'withdrawn' | 'alumni';

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  active: '재원',
  leave: '휴원',
  withdrawn: '퇴원',
  alumni: '졸업',
};

export const ACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = ['active', 'leave'];
export const INACTIVE_ENROLLMENT_STATUSES: EnrollmentStatus[] = ['withdrawn', 'alumni'];

/** 전역 학부모 프로필 */
export interface GlobalParent {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

/** 학원별 등록 정보 */
export interface StudentEnrollment {
  enrollmentId: string;
  organizationId: string;
  organizationName: string;
  industryType: string;
  customerId: string;
  status: EnrollmentStatus;
  enrolledAt: string | null;
  leftAt: string | null;
}

/** 전역 자녀 + 등록 목록 */
export interface GlobalStudent {
  studentId: string;
  displayName: string;
  birthDate: string | null;
  relationship: GuardianRelationship;
  isPrimary: boolean;
  enrollments: StudentEnrollment[];
}

/** get_my_parent_portal_tree RPC 응답 */
export interface ParentPortalTree {
  parent: GlobalParent | null;
  children: GlobalStudent[];
}
