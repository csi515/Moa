import type {
  AppNotification,
  AttendanceRecord,
  ClassItem,
  Consultation,
  Parent,
  Student,
  TuitionInvoice,
} from '../../../../types';
import type { Json, PaymentMethod as DbPaymentMethod, PaymentStatus } from '../../../../lib/supabase/database.types';
import type { StaffMetadata } from '../../types';
import type { AcademySettings, Teacher } from '../../../../types';
import type { Booking, ServiceOffering } from '../../../../core/types/schedule';
import type { PickupAddress } from '../../../../core/transport/types';


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

interface PilatesServiceMetadata {
  moduleType: 'pilates';
  maxCapacity: number;
  category: ServiceOffering['category'];
}

interface BookingMetadata {
  customerName: string;
  staffName?: string;
  serviceName?: string;
}

export function serviceOfferingToRow(offering: ServiceOffering, organizationId: string) {
  const metadata: PilatesServiceMetadata = {
    moduleType: 'pilates',
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
  const meta = (row.metadata || {}) as Partial<PilatesServiceMetadata>;
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
  const meta = (metadata || {}) as Partial<PilatesServiceMetadata>;
  return meta.moduleType === 'pilates';
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

