/**
 * 업종 무관 자원 예약 Capability.
 * 겹침 방지 RPC/EXCLUDE를 복사하지 않고 기존 원장을 호출한다.
 */
import {
  cancelResourceReservation,
  createStaffResourceReservation,
  listBookableResources,
  listPracticeRooms,
  listReservationsByDate,
  listReservationsByRange,
  listResourceReservationRows,
  listResourceReservations,
  requestResourceReservation,
  reviewResourceReservation,
  toPracticeRoomRow,
  toResourceReservation,
  toRoomReservationRow,
  upsertBookableResource,
} from './reservationService';
import { RESOURCE_RESERVATION_BLOCKING_STATUSES } from './types';
import { dayRangeSeoul } from './seoulTime';

export const resourceReservationCapability = {
  listResources: listBookableResources,
  upsertResource: upsertBookableResource,
  listReservations: listResourceReservations,
  request: requestResourceReservation,
  createStaff: createStaffResourceReservation,
  cancel: cancelResourceReservation,
  review: reviewResourceReservation,
  toPracticeRoomRow,
  toRoomReservationRow,
  toResourceReservation,
  blockingStatuses: RESOURCE_RESERVATION_BLOCKING_STATUSES,
  listPracticeRooms,
  listByDate: listReservationsByDate,
  listByRange: listReservationsByRange,
  async listMyReservations(organizationId: string) {
    const rows = await listResourceReservationRows({
      organizationId,
      order: 'desc',
      limit: 50,
    });
    return rows.map(toRoomReservationRow);
  },
  async listForCustomer(
    organizationId: string,
    customerId: string,
    options?: { fromDate?: string; limit?: number }
  ) {
    const from = options?.fromDate || new Date().toISOString().slice(0, 10);
    const { start } = dayRangeSeoul(from);
    const rows = await listResourceReservationRows({
      organizationId,
      customerId,
      status: [...RESOURCE_RESERVATION_BLOCKING_STATUSES],
      fromIso: start,
      order: 'asc',
      limit: options?.limit ?? 20,
    });
    return rows.map(toRoomReservationRow);
  },
  async listPending(organizationId: string) {
    const rows = await listResourceReservationRows({
      organizationId,
      status: 'pending',
      order: 'asc',
    });
    return rows.map(toRoomReservationRow);
  },
} as const;

export type ResourceReservationCapability = typeof resourceReservationCapability;
