import type { PickupAddress } from '@/core/transport/types';

/** 조직 멤버 역할 (Supabase member_role과 동일) */
export type UserRole = 
  | 'owner' 
  | 'admin' 
  | 'manager' 
  | 'staff' 
  | 'parent'
  | 'instructor'
  | 'member'
  | 'customer'
  | 'guardian';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  staffId?: string | null;
  parentCustomerId?: string | null;
  email: string;
}

export type StudentStatus = 'active' | 'leave' | 'withdrawn'; // 재원, 휴원, 퇴원

/** 수강 형태 — 월회비 청구 vs 회차권 차감 */
export type StudentBillingMode = 'monthly' | 'session_pass';

export const STUDENT_BILLING_MODE_LABEL: Record<StudentBillingMode, string> = {
  monthly: '월회비',
  session_pass: '회차권',
};

export function normalizeBillingMode(
  mode?: StudentBillingMode | string | null
): StudentBillingMode {
  return mode === 'session_pass' ? 'session_pass' : 'monthly';
}

export type StudentLevel = 
  | '바이엘 상' 
  | '바이엘 하' 
  | '체르니 100' 
  | '체르니 30' 
  | '체르니 40' 
  | '체르니 50' 
  | '소나티네/명곡' 
  | '작품집/쇼팽' 
  | '입시/콩쿠르' 
  | '성인 취미'
  | '어린이'
  | '초급'
  | '중급'
  | '고급'
  | '선수반'
  | '성인'
  | '시니어'
  | '0세반'
  | '1세반'
  | '2세반'
  | '3세반'
  | '4세반'
  | '5세반'
  | '혼합반'
  | '방과후';

export interface Student {
  id: string;
  studentNumber: string; // e.g. STU-2024-001
  name: string;
  gender: 'M' | 'F';
  birthDate: string; // YYYY-MM-DD
  school: string;
  grade: string; // e.g. 초3, 유치부, 중1, 성인
  /** @deprecated parent_student_links에서 파생 — UI는 getPrimaryGuardian 사용 */
  parentId?: string;
  /** @deprecated */
  parentName?: string;
  /** @deprecated */
  parentPhone?: string;
  /** 원생 본인 연락처 (선택) */
  phone?: string;
  emergencyContact?: string;
  address?: string;
  /** 셔틀 픽업·하원 서비스 이용 여부 */
  usesShuttleService?: boolean;
  /** 픽업·하원 주소 목록 (집, 할머니댁 등) */
  pickupAddresses?: PickupAddress[];
  joinDate: string; // YYYY-MM-DD
  leaveDate?: string; // YYYY-MM-DD
  status: StudentStatus;
  teacherId: string;
  teacherName: string;
  classIds: string[];
  level: StudentLevel;
  /** 수강 형태. 미설정 시 월회비 */
  billingMode?: StudentBillingMode;
  tuitionFee: number; // 월 수강료 (₩) — billingMode=monthly 일 때
  paymentDay: number; // 매월 납부일 (1~31)
  specialNotes?: string; // 특이사항 (손가락 유연성, 성향, 알레르기 등)
  memo?: string;
  avatarColor?: string;
  checkInPinSet?: boolean;
  /** 성인 본인 계정 연결. NULL/미설정 = 비회원 Customer */
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  studentIds: string[];
  notes?: string;
  createdAt: string;
}

/**
 * 강사 급여 정산 방식
 * - hourly: 레슨 실적 × 회당 지급액 (기존 시급 필드 재사용)
 * - attendance: 출근 횟수 × 1회 지급액 (실적은 정산 화면에서 입력)
 * - work_hours: 근무 시간 × 시간당 지급액 (실적은 정산 화면에서 입력)
 * - monthly: 월 고정
 * - none: 정산 안 함
 */
export type TeacherPayType = 'hourly' | 'attendance' | 'work_hours' | 'monthly' | 'none';

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email?: string;
  userId?: string | null;
  hireDate: string;
  status: 'active' | 'inactive' | 'resigned';
  specialty?: string;
  /** 월급 (₩) — payType=monthly */
  salary?: number;
  /**
   * 단위 지급액 (₩)
   * - hourly: 레슨 1회당
   * - attendance: 출근 1회당
   * - work_hours: 근무 1시간당
   */
  hourlyRate?: number;
  /** 정산 방식. 미설정 시 hourlyRate/salary로 추론 */
  payType?: TeacherPayType;
  color?: string;
  memo?: string;
  classIds?: string[];
  /** 원장이 이 강사에게 켠 허용. 없으면 모두 꺼짐 */
  grants?: import('@/core/staff/staffGrants').StaffGrants;
}

export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

/** 피부관리 관리사 근무 창. 설정 JSON에만 둔다 */
export interface StaffWorkWindow {
  staffId: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
}

export interface ClassItem {
  id: string;
  name: string; // e.g. 월수금 유치부 기초반, 화목 체르니 중급반
  teacherId: string;
  teacherName: string;
  daysOfWeek: DayOfWeek[];
  startTime: string; // HH:mm e.g. 14:00
  endTime: string; // HH:mm e.g. 14:50
  capacity: number;
  level?: string;
  targetLevel?: string;
  fee?: number;
  textbook?: string;
  room: string; // e.g. 1번 그랜드룸, 2번 업라이트실
  memo?: string;
  color?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'make_up'; // 출석, 결석, 지각, 조퇴, 보강

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  status: AttendanceStatus;
  absentReason?: string;
  makeUpRequired?: boolean;
  makeUpDate?: string;
  /** 보강 슬롯 (시간·연습실·강사) */
  makeUpStartTime?: string;
  makeUpEndTime?: string;
  makeUpRoom?: string;
  makeUpTeacherId?: string;
  makeUpTeacherName?: string;
  memo?: string;
  createdBy: string;
  createdAt?: string;
  /** 회차권 차감 시 연결된 이용권 id */
  sessionPassId?: string;
}

export type PaymentMethod =
  | 'card'
  | 'transfer'
  | 'cash'
  | 'other'
  | 'local_currency'
  | 'onsite_card';
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'overdue' | 'cancelled';

export interface TuitionInvoice {
  id: string;
  studentId: string;
  studentName: string;
  yearMonth: string; // YYYY-MM
  /** 청구서 제목 (예: 2026년 3월 피아노 수강료) */
  title?: string;
  baseTuition?: number;
  baseFee?: number;
  discount?: number;
  discountAmount?: number;
  textbookFee?: number;
  additionalAmount?: number;
  /** 연주회·콩쿠르 등 기타 합산 금액 */
  extraFee?: number;
  extraFeeLabel?: string;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod | null;
  paidAt?: string;
  paidDate?: string;
  notes?: string;
  receiptNumber?: string;
  /** 월 청구에 교재·연주회비 합산 여부 (미설정 시 학원 설정) */
  includeExtras?: boolean;
  /** 합산된 교재 판매 id */
  linkedTextbookSaleIds?: string[];
  /** 합산된 연주회·기타 항목 */
  linkedExtraItems?: InvoiceExtraItem[];
  /**
   * 수동 발송 여부. false = 초안(학부모 미노출), true = 발송됨.
   * undefined = 레거시(발송된 것으로 간주).
   */
  invoiceSent?: boolean;
  /** 원장이 청구서를 수동 발송한 시각 */
  sentAt?: string | null;
  /** 학부모 현금영수증 발행 요청 */
  cashReceiptRequested?: boolean;
}

/** 월 청구에 합산된 교재 외 항목 (연주회비 등) */
export interface InvoiceExtraItem {
  id: string;
  label: string;
  amount: number;
  sourceType: 'recital' | 'manual';
}

/** 월회비 납부 원장 — 청구항목(TuitionInvoice)에 대한 실제 입금 */
export interface TuitionPayment {
  id: string;
  invoiceId: string;
  studentId: string;
  studentName: string;
  yearMonth: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethod;
  memo?: string;
  receiptNumber?: string;
  /** 현금영수증 발행 여부 */
  cashReceiptIssued?: boolean;
  createdAt?: string;
}

/** 연습실 예약 */
export type PracticeRoomBookingStatus =
  | 'scheduled'
  | 'cancelled'
  | 'completed'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface PracticeRoomBooking {
  id: string;
  studentId: string;
  studentName: string;
  room: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  teacherId?: string;
  teacherName?: string;
  memo?: string;
  createdBy: string;
  status: PracticeRoomBookingStatus;
  createdAt?: string;
}

export type ConsultationType = 'parent' | 'student' | 'career' | 'learning' | 'other';

export interface Consultation {
  id: string;
  studentId: string;
  studentName: string;
  parentName?: string;
  date: string; // YYYY-MM-DD
  type: ConsultationType;
  content: string;
  result: string;
  followUp?: string;
  nextDate?: string;
  counselorId: string;
  counselorName: string;
  createdAt?: string;
}

export interface PracticeRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  minutes: number; // 연습시간 (분)
  songTitle: string;
  textbook?: string;
  page?: string;
  homework?: string;
  teacherEvaluation?: string; // 1~5점 또는 코멘트
  difficultyPart?: string;
  nextAssignment?: string;
  /** 스태프 등록 vs 학부모 가정 연습 일지 */
  source?: 'staff' | 'parent';
  /** 학부모 일지 스태프 확인 여부 */
  staffReviewed?: boolean;
  staffReviewedAt?: string;
  staffReviewNote?: string;
  createdAt?: string;
}

export interface LessonRecord {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  classId?: string;
  className?: string;
  songTitle: string;
  progress: string; // e.g. 체르니 30번 5번곡 템포 110 완주
  lessonContent: string;
  strengths?: string;
  weaknesses?: string;
  homework?: string;
  nextPlan?: string;
  teacherNotes?: string;
  memo?: string;
  teacherId: string;
  teacherName: string;
  createdAt?: string;
}

export type PerformanceVideoType = 'recital' | 'competition' | 'lesson' | 'practice' | 'other';

export interface PerformanceVideo {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  youtubeUrl: string;
  recordedDate?: string;
  eventType: PerformanceVideoType;
  songTitle?: string;
  memo?: string;
  eventId?: string;
  eventTitle?: string;
  createdAt?: string;
}

export interface Textbook {
  id: string;
  title: string;
  publisher: string;
  author?: string;
  isbn?: string;
  level: string;
  price: number; // alias for salePrice
  salePrice: number; // 판매가격
  costPrice: number; // 매입가격
  /**
   * 현재 재고 미러.
   * 실제 source of truth는 Core Inventory(productId).
   * Core 연동 후 재고 변경은 Core 반영 뒤 이 필드를 동기화한다.
   */
  stock: number;
  currentStock?: number; // alias for stock
  minStock: number; // 최소 재고
  isForSale: boolean; // 판매 여부
  memo?: string;
  /** Core products.id — 재고 연동 키. 없으면 이관 시 textbook.id로 생성 */
  productId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type TextbookPaymentStatus = 'unpaid' | 'partial' | 'paid'; // 미납, 일부납부, 납부완료

export interface TextbookSale {
  id: string;
  studentId: string;
  studentName: string;
  parentId?: string;
  parentName: string;
  parentPhone: string;
  textbookId: string;
  textbookTitle: string;
  saleDate: string; // YYYY-MM-DD
  quantity: number; // 수량
  unitPrice: number; // 판매단가
  discount: number; // 할인금액
  totalAmount: number; // 최종 판매금액 (수량 * 단가 - 할인)
  paidAmount: number; // 누적 납부금액
  unpaidAmount: number; // 미납금액 (최종금액 - 누적납부금액)
  status: TextbookPaymentStatus;
  paymentMethod?: PaymentMethod | null;
  memo?: string;
  teacherId?: string;
  teacherName?: string;
  createdAt?: string;
  updatedAt?: string;
  /** 월 청구서에 합산된 경우 해당 청구서 id — 별도 미납/중복 집계 제외 */
  billingInvoiceId?: string;
}

export interface TextbookPayment {
  id: string;
  textbookSaleId: string;
  studentId?: string;
  studentName?: string;
  textbookTitle?: string;
  paymentDate: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: PaymentMethod;
  memo?: string;
  receiptNumber?: string;
  createdAt?: string;
}

export type InventoryTransactionType = 'inbound' | 'sale' | 'return' | 'adjust'; // 입고, 판매, 반품, 재고조정

export interface TextbookInventoryTransaction {
  id: string;
  textbookId: string;
  textbookTitle: string;
  transactionType: InventoryTransactionType;
  quantity: number; // 변동 수량 (양수/음수 또는 절대값)
  previousStock: number;
  currentStock: number;
  referenceId?: string; // e.g. textbookSaleId
  transactionDate: string; // YYYY-MM-DD
  memo?: string;
  createdAt?: string;
}

export interface StudentMonthlyBillingSummary {
  studentId: string;
  studentName: string;
  yearMonth: string;
  tuitionBilled: number;
  tuitionPaid: number;
  tuitionUnpaid: number;
  tuitionStatus: InvoiceStatus;
  tuitionTotal?: number; // alias for tuitionBilled
  textbookBilled: number;
  textbookPaid: number;
  textbookUnpaid: number;
  textbookStatus: TextbookPaymentStatus;
  textbookTotal?: number; // alias for textbookBilled
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  grandTotal?: number; // alias for totalBilled
  grandPaid?: number; // alias for totalPaid
  grandUnpaid?: number; // alias for totalUnpaid
  invoices?: TuitionInvoice[];
  textbookSales?: TextbookSale[];
}

export interface CombinedPaymentRequest {
  studentId: string;
  yearMonth: string;
  /** @deprecated tuitionPayments 사용 권장 */
  tuitionAmount?: number;
  /** 항목별 월회비 납부 (부분납 지원) */
  tuitionPayments?: { invoiceId: string; amount: number }[];
  textbookPayments: { saleId: string; amount: number }[];
  paymentMethod: PaymentMethod;
  paymentDate: string;
  memo?: string;
}

export interface Song {
  id: string;
  title: string;
  composer: string;
  difficulty: '초급' | '중급' | '고급' | '최고급';
  genre: '클래식' | '재즈/뉴에이지' | 'OST/가요' | '동요/소곡' | '입시곡';
  relatedTextbook?: string;
  memo?: string;
  /** 교재·곡 자료실 확장 필드 (metadata 저장) */
  publisher?: string;
  level?: StudentLevel;
  resourceType?: 'textbook' | 'repertoire' | 'competition' | 'theory';
  description?: string;
  difficultyStars?: number;
}

export type ExpenseCategory = 
  | 'rent' 
  | 'utility' 
  | 'maintenance' 
  | 'electricity' 
  | 'water' 
  | 'textbook' 
  | 'supplies' 
  | 'snacks' 
  | 'marketing' 
  | 'teacher_salary' 
  | 'salary'
  | 'instructor_fee'
  | 'piano_tuning' 
  | 'tuning' 
  | 'other';

export interface ExpenseItem {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  recipient?: string;
  vendor?: string;
  memo?: string;
  receiptMemo?: string;
  /** 강사 정산 연동 */
  teacherId?: string;
  settlementYearMonth?: string;
  settlementKind?: 'teacher_payroll';
  /** 정산 계산·조정 내역 (지출 metadata에 동기화) */
  settlementPayType?: TeacherPayType;
  settlementQuantity?: number;
  settlementRate?: number;
  settlementCalculatedAmount?: number;
  settlementAdjustmentAmount?: number;
  settlementAdjustmentReason?: string;
}
export type Expense = ExpenseItem;

export type NotificationType = 'notice' | 'attendance' | 'tuition_due' | 'tuition_unpaid' | 'absence' | 'makeup' | 'consultation' | 'announcement' | 'practice';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetGroup?: string;
  recipientCount?: number;
  targetStudentId?: string;
  targetStudentName?: string;
  targetParentPhone?: string;
  scheduledDate?: string;
  status?: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  createdAt?: string;
}
export type AppNotification = NotificationItem;

/** 연체 포함 미납 청구서 */
export interface UnpaidInvoiceItem extends TuitionInvoice {
  daysOverdue: number;
}

/** 원생별 통합 미납 요약 */
export interface StudentUnpaidSummary {
  studentId: string;
  studentName: string;
  parentName: string;
  parentPhone: string;
  tuitionUnpaid: number;
  textbookUnpaid: number;
  totalUnpaid: number;
  overdueCount: number;
  oldestOverdueDays: number;
  tuitionItems: UnpaidInvoiceItem[];
  textbookItems: (TextbookSale & { daysOverdue: number })[];
}

/** 보강 수업 항목 */
export type MakeupStatus = 'pending' | 'scheduled' | 'completed';

export interface MakeupItem {
  attendanceId: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  classId: string;
  className: string;
  originalDate: string;
  absentReason?: string;
  makeUpDate?: string;
  makeUpStartTime?: string;
  makeUpEndTime?: string;
  makeUpRoom?: string;
  makeUpTeacherId?: string;
  makeUpTeacherName?: string;
  status: MakeupStatus;
  memo?: string;
}

/** 보강 일정 등록 입력 */
export interface MakeupScheduleInput {
  date: string;
  startTime?: string;
  endTime?: string;
  room?: string;
  teacherId?: string;
  teacherName?: string;
}

export interface AcademyEvent {
  id: string;
  title: string;
  startDate: string;
  endDate?: string;
  type: 'concert' | 'competition' | 'special_lesson' | 'tuning' | 'vacation' | 'other';
  description?: string;
  color?: string;
  participantIds?: string[];
  /** 참가비(원) — 월 청구 합산 옵션 시 청구서 extraFee에 포함 */
  participationFee?: number;
}

/** 연주회·콩쿠르 참가 원생 + 영상 등록 현황 */
export interface EventParticipantSummary {
  studentId: string;
  studentName: string;
  parentPhone: string;
  level?: StudentLevel;
  hasVideo: boolean;
  videoId?: string;
  videoTitle?: string;
}

export type AcademyRoomKind = 'classroom' | 'practice' | 'treatment';

/** 학원 강의실·연습실·관리실 마스터 */
export interface AcademyRoom {
  id: string;
  name: string;
  kind: AcademyRoomKind;
}

/** 피부관리 판매 상품 */
export interface RetailProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface AcademySettings {
  name: string;
  directorName?: string;
  representative?: string;
  address: string;
  phone: string;
  businessNumber?: string;
  defaultTuitionFee: number;
  defaultPaymentDay?: number;
  /** 신규 원생 기본 수강 형태 */
  defaultBillingMode?: StudentBillingMode;
  /**
   * 월회비 청구서 생성 시 미납 교재비·해당 월 연주회 참가비를 합산합니다.
   * 기본값 false (기존 동작 유지)
   */
  includeExtrasInMonthlyInvoice?: boolean;
  defaultLessonMinutes?: number;
  /** 상담 예약 슬롯 기본 간격(분). 미설정 시 30 */
  consultationSlotMinutes?: number;
  attendanceAlertEnabled?: boolean;
  tuitionReminderDaysBefore?: number;
  bankAccount?: string | {
    bank: string;
    accountNumber: string;
    holder: string;
  };
  announcement?: string;
  /**
   * 공개 페이지용 운영 시간 문구.
   * organizations.settings.business_hours 와 동일 키로 동기화됨.
   */
  business_hours?: string;
  /** 강의실·연습실·관리실 목록 */
  rooms?: AcademyRoom[];
  /** 피부관리 상품 카탈로그 */
  retailCatalog?: RetailProduct[];
  /**
   * Skin 상품·재고 Core 이관 완료 시각(ISO).
   * 설정되면 UI는 Core를 사용. retailCatalog JSON은 삭제하지 않고 보존.
   */
  skinRetailCoreMigratedAt?: string | null;
  /** 피부관리 예약금. 끄면 신청만 받는다 */
  depositEnabled?: boolean;
  depositAmount?: number;
  /**
   * 필라테스 슬롯 모집 마감·정원 오버라이드.
   * SLOT_RECRUITMENTS LOCAL_ONLY 키와 이중 저장 — organizations.settings로 다기기 동기화.
   */
  slotRecruitments?: import('@/core/types/schedule').SlotRecruitment[];
  /** 관리사 근무시간. 없으면 겹침만 검사 */
  staffHours?: StaffWorkWindow[];
  /** Industry Module 기능 플래그 */
  features?: {
    attendance?: {
      enabled?: boolean;
    };
    /** 소매 포인트 (사업장 단위). 1P=1원은 앱 상수 */
    points?: {
      /** 포인트 사용 ON/OFF */
      enabled?: boolean;
      /** 포인트 적립 ON/OFF */
      earnEnabled?: boolean;
      /** 기본 적립률(%) — 예: 1 = 1% */
      earnRatePercent?: number;
    };
  };
}

/** Phase 2: 고객 가입 플로우 관련 타입 */

/** 공개 조직 정보 (로그인 불필요) */
export interface PublicOrgInfo {
  id: string;
  name: string;
  industry_type: string;
  public_code: string;
  slug: string | null;
  address: string | null;
  phone: string | null;
  email?: string | null;
  description?: string | null;
  business_hours?: string | null;
  representative_name?: string | null;
  is_active: boolean;
}

/** 가입 신청 상태 */
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

/** 가입 신청 타입 */
export type JoinRequestType = 'membership' | 'trial' | 'consultation';

/** 고객 가입 신청 */
export interface CustomerJoinRequest {
  id: string;
  organization_id: string;
  /** list_my_customer_join_requests RPC에서 채움 */
  organization_name?: string | null;
  organization_public_code?: string | null;
  applicant_user_id: string;
  applicant_name: string;
  applicant_phone: string | null;
  applicant_email: string | null;
  request_type: JoinRequestType;
  message: string | null;
  customer_metadata: Record<string, unknown>;
  status: JoinRequestStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}



export interface ConsultationSubmission {
  contact_name: string;
  contact_phone: string;
  message: string;
  preferred_time?: string;
}

/** Core Schedule + Reservation System Types */

/** 일정 상태 */
export type ScheduleStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

/** 예약 상태 */
export type ReservationStatus = 'requested' | 'confirmed' | 'cancelled';

/** Core 일정 (조직의 시간 기반 활동 또는 예약 가능한 슬롯) */
export interface CoreSchedule {
  id: string;
  organization_id: string;
  title: string | null;
  description: string | null;
  customer_id: string | null;
  staff_id: string | null;
  service_id: string | null;
  starts_at: string; // ISO timestamp
  ends_at: string; // ISO timestamp
  status: ScheduleStatus;
  is_bookable: boolean;
  max_capacity: number;
  memo: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** 예약 가능한 일정 (고객이 볼 수 있는 슬롯) */
export interface BookableSchedule {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  max_capacity: number;
  confirmed_count: number;
  available_slots: number;
  service_id: string | null;
  service_name: string | null;
  staff_id: string | null;
  staff_name: string | null;
}

/** 예약 */
export interface Reservation {
  id: string;
  organization_id: string;
  schedule_id: string;
  customer_id: string | null;
  user_id: string | null;
  applicant_name: string;
  applicant_phone: string | null;
  applicant_email: string | null;
  request_message: string | null;
  status: ReservationStatus;
  confirmed_by: string | null;
  confirmed_at: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** 예약 상세 (일정 정보 포함) */
export interface ReservationDetail extends Reservation {
  schedule_title: string;
  schedule_starts_at: string;
  schedule_ends_at: string;
  confirmed_by_name: string | null;
  cancelled_by_name: string | null;
}

/** 내 예약 (고객용) */
export interface MyReservation {
  id: string;
  organization_id: string;
  organization_name: string;
  schedule_id: string;
  schedule_title: string;
  schedule_starts_at: string;
  schedule_ends_at: string;
  status: ReservationStatus;
  request_message: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
}

/** 예약 신청 폼 */
export interface ReservationRequest {
  schedule_id: string;
  applicant_name: string;
  applicant_phone?: string;
  applicant_email?: string;
  request_message?: string;
}

/** 일정 생성/수정 폼 */
export interface ScheduleFormData {
  title: string;
  description?: string;
  starts_at: string; // ISO timestamp
  ends_at: string; // ISO timestamp
  is_bookable: boolean;
  max_capacity: number;
  service_id?: string;
  staff_id?: string;
  memo?: string;
}
