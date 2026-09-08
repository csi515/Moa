const OPEN_MEMBERSHIP_JOINS_KEY = 'moa_open_membership_joins';
const OPEN_GUARDIAN_ENROLLMENTS_KEY = 'moa_open_guardian_enrollments';
const OPEN_CONSULTATION_INQUIRIES_KEY = 'moa_open_consultation_inquiries';

/** 홈 알림에서 학생 화면의 수강 가입 목록으로 스크롤 */
export function requestOpenMembershipJoins(): void {
  sessionStorage.setItem(OPEN_MEMBERSHIP_JOINS_KEY, '1');
}

export function consumeOpenMembershipJoins(): boolean {
  if (sessionStorage.getItem(OPEN_MEMBERSHIP_JOINS_KEY) !== '1') return false;
  sessionStorage.removeItem(OPEN_MEMBERSHIP_JOINS_KEY);
  return true;
}

/** 홈 알림에서 학부모 등록 목록으로 스크롤 */
export function requestOpenGuardianEnrollments(): void {
  sessionStorage.setItem(OPEN_GUARDIAN_ENROLLMENTS_KEY, '1');
}

export function consumeOpenGuardianEnrollments(): boolean {
  if (sessionStorage.getItem(OPEN_GUARDIAN_ENROLLMENTS_KEY) !== '1') return false;
  sessionStorage.removeItem(OPEN_GUARDIAN_ENROLLMENTS_KEY);
  return true;
}

/** 홈 알림에서 상담 허브의 문의 세그먼트로 이동 */
export function requestOpenConsultationInquiries(): void {
  sessionStorage.setItem(OPEN_CONSULTATION_INQUIRIES_KEY, '1');
}

export function consumeOpenConsultationInquiries(): boolean {
  if (sessionStorage.getItem(OPEN_CONSULTATION_INQUIRIES_KEY) !== '1') return false;
  sessionStorage.removeItem(OPEN_CONSULTATION_INQUIRIES_KEY);
  return true;
}
