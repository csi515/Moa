import type { Booking, BookingStatus, ServiceOffering, SlotRecruitment } from '@/core/types/schedule';

const ACTIVE_STATUSES: BookingStatus[] = ['scheduled', 'confirmed', 'completed', 'no_show'];

/** 미지정 강사 슬롯 키 토큰 */
export const UNASSIGNED_STAFF_TOKEN = '_unassigned_';

export function normalizeStaffId(staffId?: string | null): string {
  return staffId?.trim() ? staffId.trim() : UNASSIGNED_STAFF_TOKEN;
}

/**
 * 같은 수업 + 같은 강사 + 같은 시작 시각 = 하나의 모집 슬롯.
 * 강사가 다르면 같은 시간이라도 서로 독립적으로 예약·정원 관리.
 */
export function buildSlotKey(serviceId: string, staffId: string | null | undefined, startsAt: string): string {
  return `${serviceId}|${normalizeStaffId(staffId)}|${startsAt}`;
}

export function isActiveBookingStatus(status: BookingStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function countSlotOccupancy(
  bookings: Booking[],
  serviceId: string,
  staffId: string | null | undefined,
  startsAt: string
): number {
  const staffToken = normalizeStaffId(staffId);
  return bookings.filter((b) => {
    if (b.serviceId !== serviceId || b.startsAt !== startsAt) return false;
    if (!isActiveBookingStatus(b.status)) return false;
    return normalizeStaffId(b.staffId) === staffToken;
  }).length;
}

export interface SlotCapacityInfo {
  slotKey: string;
  serviceId: string;
  staffId: string;
  startsAt: string;
  occupied: number;
  maxCapacity: number;
  remaining: number;
  closedManually: boolean;
  /** 수동 마감 또는 정원 도달 */
  isClosed: boolean;
}

export function getSlotCapacityInfo(params: {
  service: ServiceOffering;
  staffId?: string | null;
  startsAt: string;
  bookings: Booking[];
  recruitments?: SlotRecruitment[];
}): SlotCapacityInfo {
  const { service, staffId, startsAt, bookings, recruitments = [] } = params;
  const normalizedStaffId = normalizeStaffId(staffId);
  const slotKey = buildSlotKey(service.id, normalizedStaffId, startsAt);
  const occupied = countSlotOccupancy(bookings, service.id, normalizedStaffId, startsAt);
  const maxCapacity = Math.max(1, service.maxCapacity || 1);
  const closedManually = recruitments.some((r) => {
    const key =
      r.id.includes('|') && r.id.split('|').length >= 3
        ? r.id
        : buildSlotKey(r.serviceId, r.staffId ?? UNASSIGNED_STAFF_TOKEN, r.startsAt);
    return key === slotKey && r.closedManually;
  });
  const remaining = Math.max(0, maxCapacity - occupied);
  const isClosed = closedManually || remaining <= 0;

  return {
    slotKey,
    serviceId: service.id,
    staffId: normalizedStaffId,
    startsAt,
    occupied,
    maxCapacity,
    remaining,
    closedManually,
    isClosed,
  };
}
