/** 조직 멤버 역할 (Supabase member_role과 동일) */
export type UserRole = 'owner' | 'admin' | 'manager' | 'staff' | 'parent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  staffId?: string | null;
  parentCustomerId?: string | null;
  email: string;
}

export type StudentStatus = 'active' | 'leave' | 'withdrawn'; // 재원, 휴원, 퇴원
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
  | '성인 취미';

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
  joinDate: string; // YYYY-MM-DD
  leaveDate?: string; // YYYY-MM-DD
  status: StudentStatus;
  teacherId: string;
  teacherName: string;
  classIds: string[];
  level: StudentLevel;
  tuitionFee: number; // 월 수강료 (₩)
  paymentDay: number; // 매월 납부일 (1~31)
  specialNotes?: string; // 특이사항 (손가락 유연성, 성향, 알레르기 등)
  memo?: string;
  avatarColor?: string;
  checkInPinSet?: boolean;
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

export interface Teacher {
  id: string;
  name: string;
  phone: string;
  email?: string;
  userId?: string | null;
  hireDate: string;
  status: 'active' | 'inactive' | 'resigned';
  specialty?: string;
  salary?: number; // 월급 (₩)
  color?: string;
  memo?: string;
  classIds?: string[];
}

export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일';

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
  memo?: string;
  createdBy: string;
  createdAt?: string;
}

export type PaymentMethod = 'card' | 'transfer' | 'cash' | 'other';
export type InvoiceStatus = 'paid' | 'partial' | 'unpaid' | 'overdue';

export interface TuitionInvoice {
  id: string;
  studentId: string;
  studentName: string;
  yearMonth: string; // YYYY-MM
  baseTuition?: number;
  baseFee?: number;
  discount?: number;
  discountAmount?: number;
  textbookFee?: number;
  additionalAmount?: number;
  extraFee?: number;
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
  stock: number; // 현재 재고
  currentStock?: number; // alias for stock
  minStock: number; // 최소 재고
  isForSale: boolean; // 판매 여부
  memo?: string;
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
  tuitionAmount: number;
  textbookPayments: {
    saleId: string;
    amount: number;
  }[];
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
}
export type Expense = ExpenseItem;

export type NotificationType = 'notice' | 'attendance' | 'tuition_due' | 'tuition_unpaid' | 'absence' | 'makeup' | 'consultation' | 'announcement';

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
  status: MakeupStatus;
  memo?: string;
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

export interface AcademySettings {
  name: string;
  directorName?: string;
  representative?: string;
  address: string;
  phone: string;
  businessNumber?: string;
  defaultTuitionFee: number;
  defaultPaymentDay?: number;
  defaultLessonMinutes?: number;
  attendanceAlertEnabled?: boolean;
  tuitionReminderDaysBefore?: number;
  bankAccount?: string | {
    bank: string;
    accountNumber: string;
    holder: string;
  };
  announcement?: string;
  /** Industry Module 기능 플래그 */
  features?: {
    attendance?: {
      enabled?: boolean;
    };
  };
}
