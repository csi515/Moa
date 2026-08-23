import type {
  AppNotification,
  AttendanceRecord,
  ClassItem,
  Consultation,
  Parent,
  Student,
  TuitionInvoice,
} from '../../../types';
import type { Json, PaymentMethod as DbPaymentMethod, PaymentStatus } from '../../../lib/supabase/database.types';
import type { StaffMetadata } from '../types';
import type { AcademySettings, Teacher } from '../../../types';
import type { Booking, ServiceOffering } from '../../../core/types/schedule';

// ─── Staff (Teachers) ───────────────────────────────────────────────

export function teacherToStaffRow(teacher: Teacher, organizationId: string) {
  const metadata: StaffMetadata = {
    hireDate: teacher.hireDate,
    specialty: teacher.specialty,
    salary: teacher.salary,
    color: teacher.color,
    memo: teacher.memo,
    classIds: teacher.classIds,
  };

  return {
    id: teacher.id,
    organization_id: organizationId,
    name: teacher.name,
    phone: teacher.phone || null,
    email: teacher.email || null,
    status: teacher.status,
    metadata: metadata as unknown as Json,
  };
}

export function staffRowToTeacher(row: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  user_id?: string | null;
  status: string;
  metadata: Json;
}): Teacher {
  const meta = (row.metadata || {}) as StaffMetadata;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || undefined,
    userId: row.user_id ?? null,
    hireDate: meta.hireDate || new Date().toISOString().slice(0, 10),
    status: (row.status as Teacher['status']) || 'active',
    specialty: meta.specialty,
    salary: meta.salary,
    color: meta.color,
    memo: meta.memo,
    classIds: meta.classIds,
  };
}

// ─── Settings ─────────────────────────────────────────────────────

export function parseOrganizationSettings(
  settings: Json | null | undefined,
  fallback: AcademySettings
): AcademySettings {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return fallback;
  }
  return { ...fallback, ...(settings as unknown as AcademySettings) };
}

// ─── Customers (Students / Parents) ───────────────────────────────

interface CustomerMetadata {
  entityType?: 'student' | 'parent';
  studentNumber?: string;
  gender?: 'M' | 'F';
  birthDate?: string;
  school?: string;
  grade?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  joinDate?: string;
  leaveDate?: string;
  level?: string;
  tuitionFee?: number;
  paymentDay?: number;
  specialNotes?: string;
  avatarColor?: string;
  teacherId?: string;
  teacherName?: string;
  classIds?: string[];
  emergencyContact?: string;
  address?: string;
  studentPhone?: string;
  studentIds?: string[];
  notes?: string;
}

export function studentToCustomerRow(student: Student, organizationId: string) {
  const metadata: CustomerMetadata = {
    entityType: 'student',
    studentNumber: student.studentNumber,
    gender: student.gender,
    birthDate: student.birthDate,
    school: student.school,
    grade: student.grade,
    joinDate: student.joinDate,
    leaveDate: student.leaveDate,
    level: student.level,
    tuitionFee: student.tuitionFee,
    paymentDay: student.paymentDay,
    specialNotes: student.specialNotes,
    avatarColor: student.avatarColor,
    teacherId: student.teacherId,
    teacherName: student.teacherName,
    classIds: student.classIds,
    emergencyContact: student.emergencyContact,
    address: student.address,
    studentPhone: student.phone,
  };

  return {
    id: student.id,
    organization_id: organizationId,
    name: student.name,
    phone: student.phone || null,
    email: null,
    status: student.status,
    metadata: metadata as unknown as Json,
    memo: student.memo || null,
  };
}

export function customerRowToStudent(
  row: {
    id: string;
    name: string;
    phone: string | null;
    status: string;
    metadata: Json;
    memo: string | null;
    created_at: string;
    updated_at: string;
  },
  parentName?: string
): Student {
  const meta = (row.metadata || {}) as CustomerMetadata;
  return {
    id: row.id,
    studentNumber: meta.studentNumber || '',
    name: row.name,
    gender: meta.gender || 'M',
    birthDate: meta.birthDate || '',
    school: meta.school || '',
    grade: meta.grade || '',
    parentId: meta.parentId,
    parentName: meta.parentName || parentName || '',
    parentPhone: meta.parentPhone || '',
    phone: meta.studentPhone || undefined,
    emergencyContact: meta.emergencyContact,
    address: meta.address,
    joinDate: meta.joinDate || row.created_at.slice(0, 10),
    leaveDate: meta.leaveDate,
    status: (row.status as Student['status']) || 'active',
    teacherId: meta.teacherId || '',
    teacherName: meta.teacherName || '',
    classIds: meta.classIds || [],
    level: (meta.level as Student['level']) || '바이엘 상',
    tuitionFee: meta.tuitionFee ?? 180000,
    paymentDay: meta.paymentDay ?? 25,
    specialNotes: meta.specialNotes,
    memo: row.memo || undefined,
    avatarColor: meta.avatarColor,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function parentToCustomerRow(parent: Parent, organizationId: string) {
  const metadata: CustomerMetadata = {
    entityType: 'parent',
    studentIds: parent.studentIds,
    address: parent.address,
    notes: parent.notes,
  };

  return {
    id: parent.id,
    organization_id: organizationId,
    name: parent.name,
    phone: parent.phone || null,
    email: parent.email || null,
    status: 'active',
    metadata: metadata as unknown as Json,
    memo: parent.notes || null,
  };
}

export function customerRowToParent(row: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  metadata: Json;
  memo: string | null;
  created_at: string;
}): Parent {
  const meta = (row.metadata || {}) as CustomerMetadata;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || undefined,
    address: meta.address,
    studentIds: meta.studentIds || [],
    notes: meta.notes || row.memo || undefined,
    createdAt: row.created_at.slice(0, 10),
  };
}

export function studentContactRow(
  student: Student,
  organizationId: string,
  contactId?: string,
  guardian?: { name: string; phone: string; email?: string | null }
) {
  const g = guardian || {
    name: student.parentName || '보호자',
    phone: student.parentPhone || '',
    email: null as string | null,
  };
  if (!g.name && !g.phone) return null;

  return {
    id: contactId || crypto.randomUUID(),
    organization_id: organizationId,
    customer_id: student.id,
    name: g.name || '보호자',
    relationship: 'parent',
    phone: g.phone || null,
    email: g.email || null,
    is_primary: true,
  };
}

export function isStudentCustomer(metadata: Json): boolean {
  const meta = (metadata || {}) as CustomerMetadata;
  return meta.entityType !== 'parent';
}

export function isParentCustomer(metadata: Json): boolean {
  const meta = (metadata || {}) as CustomerMetadata;
  return meta.entityType === 'parent';
}

// ─── Services (Classes) ───────────────────────────────────────────

interface ServiceMetadata {
  teacherId: string;
  teacherName: string;
  daysOfWeek: ClassItem['daysOfWeek'];
  startTime: string;
  endTime: string;
  capacity: number;
  level?: string;
  targetLevel?: string;
  textbook?: string;
  room: string;
  color?: string;
}

function parseDurationMinutes(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return Math.max(1, eh * 60 + em - (sh * 60 + sm));
}

export function classToServiceRow(cls: ClassItem, organizationId: string) {
  const metadata: ServiceMetadata = {
    teacherId: cls.teacherId,
    teacherName: cls.teacherName,
    daysOfWeek: cls.daysOfWeek,
    startTime: cls.startTime,
    endTime: cls.endTime,
    capacity: cls.capacity,
    level: cls.level,
    targetLevel: cls.targetLevel,
    textbook: cls.textbook,
    room: cls.room,
    color: cls.color,
  };

  return {
    id: cls.id,
    organization_id: organizationId,
    name: cls.name,
    description: cls.memo || null,
    price: cls.fee ?? 0,
    duration_minutes: parseDurationMinutes(cls.startTime, cls.endTime),
    is_active: true,
    is_schedulable: true,
    metadata: metadata as unknown as Json,
  };
}

export function serviceRowToClass(row: {
  id: string;
  name: string;
  price: number;
  metadata: Json;
  description: string | null;
}): ClassItem {
  const meta = (row.metadata || {}) as unknown as ServiceMetadata;
  return {
    id: row.id,
    name: row.name,
    teacherId: meta.teacherId || '',
    teacherName: meta.teacherName || '',
    daysOfWeek: meta.daysOfWeek || [],
    startTime: meta.startTime || '09:00',
    endTime: meta.endTime || '09:50',
    capacity: meta.capacity ?? 10,
    level: meta.level,
    targetLevel: meta.targetLevel,
    fee: row.price,
    textbook: meta.textbook,
    room: meta.room || '',
    memo: row.description || undefined,
    color: meta.color,
  };
}

// ─── Payments (Invoices) ──────────────────────────────────────────

interface PaymentMetadata {
  studentName: string;
  yearMonth: string;
  baseTuition?: number;
  baseFee?: number;
  discount?: number;
  discountAmount?: number;
  textbookFee?: number;
  additionalAmount?: number;
  extraFee?: number;
  unpaidAmount?: number;
  notes?: string;
}

const INVOICE_STATUS_MAP: Record<TuitionInvoice['status'], PaymentStatus> = {
  paid: 'paid',
  partial: 'partial',
  unpaid: 'unpaid',
  overdue: 'unpaid',
};

const APP_PAYMENT_METHOD_MAP: Record<string, DbPaymentMethod> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
};

export function invoiceToPaymentRow(inv: TuitionInvoice, organizationId: string) {
  const metadata: PaymentMetadata = {
    studentName: inv.studentName,
    yearMonth: inv.yearMonth,
    baseTuition: inv.baseTuition ?? inv.baseFee,
    baseFee: inv.baseFee,
    discount: inv.discount,
    discountAmount: inv.discountAmount,
    textbookFee: inv.textbookFee,
    additionalAmount: inv.additionalAmount,
    extraFee: inv.extraFee,
    unpaidAmount: inv.unpaidAmount,
    notes: inv.notes,
  };

  return {
    id: inv.id,
    organization_id: organizationId,
    customer_id: inv.studentId,
    title: `${inv.yearMonth} 수강료`,
    billed_amount: inv.totalAmount,
    paid_amount: inv.paidAmount,
    due_date: inv.dueDate || null,
    status: INVOICE_STATUS_MAP[inv.status] || 'unpaid',
    payment_method: inv.paymentMethod
      ? APP_PAYMENT_METHOD_MAP[inv.paymentMethod] || 'other'
      : null,
    paid_at: inv.paidAt || inv.paidDate || null,
    receipt_number: inv.receiptNumber || null,
    memo: inv.notes || null,
    metadata: metadata as unknown as Json,
  };
}

export function paymentRowToInvoice(row: {
  id: string;
  customer_id: string;
  title: string;
  billed_amount: number;
  paid_amount: number;
  due_date: string | null;
  status: PaymentStatus;
  payment_method: DbPaymentMethod | null;
  paid_at: string | null;
  receipt_number: string | null;
  memo: string | null;
  metadata: Json;
}): TuitionInvoice {
  const meta = (row.metadata || {}) as unknown as PaymentMetadata;
  const yearMonth = meta.yearMonth || row.title.replace(' 수강료', '');
  const unpaidAmount = meta.unpaidAmount ?? Math.max(0, row.billed_amount - row.paid_amount);

  let status: TuitionInvoice['status'] = 'unpaid';
  if (row.status === 'paid') status = 'paid';
  else if (row.status === 'partial') status = 'partial';
  else if (row.due_date && new Date(row.due_date) < new Date() && row.paid_amount < row.billed_amount) {
    status = 'overdue';
  }

  const methodReverse: Record<string, TuitionInvoice['paymentMethod']> = {
    card: 'card',
    transfer: 'transfer',
    cash: 'cash',
    other: 'other',
    online: 'other',
  };

  return {
    id: row.id,
    studentId: row.customer_id,
    studentName: meta.studentName || '',
    yearMonth,
    baseTuition: meta.baseTuition,
    baseFee: meta.baseFee,
    discount: meta.discount,
    discountAmount: meta.discountAmount,
    textbookFee: meta.textbookFee,
    additionalAmount: meta.additionalAmount,
    extraFee: meta.extraFee,
    totalAmount: row.billed_amount,
    paidAmount: row.paid_amount,
    unpaidAmount,
    dueDate: row.due_date || '',
    status,
    paymentMethod: row.payment_method ? methodReverse[row.payment_method] : null,
    paidAt: row.paid_at || undefined,
    paidDate: row.paid_at?.slice(0, 10),
    notes: meta.notes || row.memo || undefined,
    receiptNumber: row.receipt_number || undefined,
  };
}

// ─── Consultations ────────────────────────────────────────────────

export function consultationToRow(cst: Consultation, organizationId: string) {
  return {
    id: cst.id,
    organization_id: organizationId,
    customer_id: cst.studentId,
    staff_id: cst.counselorId || null,
    consultation_date: cst.date,
    type: cst.type,
    content: cst.content,
    result: cst.result,
    follow_up: cst.followUp || null,
    next_date: cst.nextDate || null,
  };
}

export function consultationRowToApp(row: {
  id: string;
  customer_id: string;
  staff_id: string | null;
  consultation_date: string;
  type: string;
  content: string | null;
  result: string | null;
  follow_up: string | null;
  next_date: string | null;
  created_at: string;
}, studentName = '', counselorName = ''): Consultation {
  return {
    id: row.id,
    studentId: row.customer_id,
    studentName,
    date: row.consultation_date,
    type: row.type as Consultation['type'],
    content: row.content || '',
    result: row.result || '',
    followUp: row.follow_up || undefined,
    nextDate: row.next_date || undefined,
    counselorId: row.staff_id || '',
    counselorName,
    createdAt: row.created_at,
  };
}

// ─── Notifications ────────────────────────────────────────────────

interface NotificationMetadata {
  targetGroup?: string;
  recipientCount?: number;
  targetStudentName?: string;
  targetParentPhone?: string;
}

export function notificationToRow(notif: AppNotification, organizationId: string) {
  const metadata: NotificationMetadata = {
    targetGroup: notif.targetGroup,
    recipientCount: notif.recipientCount,
    targetStudentName: notif.targetStudentName,
    targetParentPhone: notif.targetParentPhone,
  };

  return {
    id: notif.id,
    organization_id: organizationId,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    target_type: notif.targetStudentId ? 'customer' : notif.targetGroup || null,
    target_id: notif.targetStudentId || null,
    status: (notif.status || 'pending') as 'pending' | 'sent' | 'failed',
    channel: 'app' as const,
    scheduled_at: notif.scheduledDate || null,
    sent_at: notif.sentAt || null,
    metadata: metadata as unknown as Json,
  };
}

export function notificationRowToApp(row: {
  id: string;
  type: string;
  title: string;
  message: string;
  target_type: string | null;
  target_id: string | null;
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  metadata: Json;
  created_at: string;
}): AppNotification {
  const meta = (row.metadata || {}) as NotificationMetadata;
  return {
    id: row.id,
    type: row.type as AppNotification['type'],
    title: row.title,
    message: row.message,
    targetGroup: meta.targetGroup || row.target_type || undefined,
    recipientCount: meta.recipientCount,
    targetStudentId: row.target_id || undefined,
    targetStudentName: meta.targetStudentName,
    targetParentPhone: meta.targetParentPhone,
    scheduledDate: row.scheduled_at || undefined,
    status: row.status as AppNotification['status'],
    sentAt: row.sent_at || undefined,
    createdAt: row.created_at,
  };
}

// ─── Schedules (Attendance) ───────────────────────────────────────

interface ScheduleMetadata {
  studentName: string;
  classId: string;
  className: string;
  attendanceStatus: AttendanceRecord['status'];
  absentReason?: string;
  makeUpRequired?: boolean;
  makeUpDate?: string;
  createdBy: string;
}

const ATTENDANCE_STATUS_MAP: Record<AttendanceRecord['status'], string> = {
  present: 'completed',
  absent: 'no_show',
  late: 'confirmed',
  early_leave: 'confirmed',
  make_up: 'completed',
};

export function attendanceToScheduleRow(
  record: AttendanceRecord,
  organizationId: string,
  startsAt: string,
  endsAt: string
) {
  const metadata: ScheduleMetadata = {
    studentName: record.studentName,
    classId: record.classId,
    className: record.className,
    attendanceStatus: record.status,
    absentReason: record.absentReason,
    makeUpRequired: record.makeUpRequired,
    makeUpDate: record.makeUpDate,
    createdBy: record.createdBy,
  };

  return {
    id: record.id,
    organization_id: organizationId,
    customer_id: record.studentId,
    staff_id: null,
    service_id: record.classId || null,
    starts_at: startsAt,
    ends_at: endsAt,
    status: ATTENDANCE_STATUS_MAP[record.status] as 'completed' | 'no_show' | 'confirmed',
    memo: record.memo || null,
    metadata: metadata as unknown as Json,
  };
}

export function scheduleRowToAttendance(row: {
  id: string;
  customer_id: string | null;
  service_id: string | null;
  starts_at: string;
  status: string;
  memo: string | null;
  metadata: Json;
  created_at: string;
}): AttendanceRecord {
  const meta = (row.metadata || {}) as unknown as ScheduleMetadata;
  const statusReverse: Record<string, AttendanceRecord['status']> = {
    completed: meta.attendanceStatus || 'present',
    no_show: 'absent',
    confirmed: meta.attendanceStatus || 'late',
    scheduled: 'present',
    cancelled: 'absent',
  };

  return {
    id: row.id,
    date: row.starts_at.slice(0, 10),
    studentId: row.customer_id || '',
    studentName: meta.studentName || '',
    classId: meta.classId || row.service_id || '',
    className: meta.className || '',
    status: statusReverse[row.status] || meta.attendanceStatus || 'present',
    absentReason: meta.absentReason,
    makeUpRequired: meta.makeUpRequired,
    makeUpDate: meta.makeUpDate,
    memo: row.memo || undefined,
    createdBy: meta.createdBy || '',
    createdAt: row.created_at,
  };
}

export function buildScheduleTimes(record: AttendanceRecord, cls?: ClassItem): {
  startsAt: string;
  endsAt: string;
} {
  const startTime = cls?.startTime || '09:00';
  const endTime = cls?.endTime || '09:50';
  return {
    startsAt: `${record.date}T${startTime}:00`,
    endsAt: `${record.date}T${endTime}:00`,
  };
}

// ─── Pilates: Service Offerings & Bookings ────────────────────────

interface BookingServiceMetadata {
  moduleType: 'pilates' | 'skincare';
  maxCapacity: number;
  category: ServiceOffering['category'];
}

interface BookingMetadata {
  customerName: string;
  staffName?: string;
  serviceName?: string;
}

export function serviceOfferingToRow(
  offering: ServiceOffering,
  organizationId: string,
  moduleType: 'pilates' | 'skincare' = 'pilates'
) {
  const metadata: BookingServiceMetadata = {
    moduleType,
    maxCapacity: offering.maxCapacity,
    category: offering.category,
  };

  return {
    id: offering.id,
    organization_id: organizationId,
    name: offering.name,
    description: offering.description || null,
    price: offering.price,
    duration_minutes: offering.durationMinutes,
    is_active: offering.isActive,
    is_schedulable: offering.isSchedulable,
    metadata: metadata as unknown as Json,
  };
}

export function serviceRowToOffering(row: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  is_schedulable: boolean;
  metadata: Json;
}): ServiceOffering {
  const meta = (row.metadata || {}) as Partial<BookingServiceMetadata>;
  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    price: row.price,
    durationMinutes: row.duration_minutes,
    maxCapacity: meta.maxCapacity ?? 1,
    category: meta.category ?? 'private',
    isActive: row.is_active,
    isSchedulable: row.is_schedulable,
  };
}

export function isPilatesServiceRow(metadata: Json): boolean {
  const meta = (metadata || {}) as Partial<BookingServiceMetadata>;
  return meta.moduleType === 'pilates' || meta.moduleType === 'skincare';
}

export function isBookingServiceRow(metadata: Json): boolean {
  return isPilatesServiceRow(metadata);
}

export function bookingToScheduleRow(booking: Booking, organizationId: string) {
  const metadata: BookingMetadata = {
    customerName: booking.customerName,
    staffName: booking.staffName,
    serviceName: booking.serviceName,
  };

  return {
    id: booking.id,
    organization_id: organizationId,
    customer_id: booking.customerId,
    staff_id: booking.staffId || null,
    service_id: booking.serviceId || null,
    starts_at: booking.startsAt,
    ends_at: booking.endsAt,
    status: booking.status,
    memo: booking.memo || null,
    metadata: metadata as unknown as Json,
  };
}

export function scheduleRowToBooking(row: {
  id: string;
  customer_id: string | null;
  staff_id: string | null;
  service_id: string | null;
  starts_at: string;
  ends_at: string;
  status: string;
  memo: string | null;
  metadata: Json;
  created_at: string;
}): Booking {
  const meta = (row.metadata || {}) as unknown as BookingMetadata;
  return {
    id: row.id,
    customerId: row.customer_id || '',
    customerName: meta.customerName || '',
    staffId: row.staff_id || undefined,
    staffName: meta.staffName,
    serviceId: row.service_id || undefined,
    serviceName: meta.serviceName,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status as Booking['status'],
    memo: row.memo || undefined,
    createdAt: row.created_at,
  };
}
