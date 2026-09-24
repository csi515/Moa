/**
 * 공통 자원 예약. 겹침은 book_room_reservation_guarded / EXCLUDE 재사용.
 * 업종 분기를 두지 않는다.
 */
import { getCoreClient } from '@/lib/supabase';
import { mapResourceReservationError } from './reservationErrors';
import { PRACTICE_ROOM_RESOURCE_KIND, RESOURCE_RESERVATION_BLOCKING_STATUSES } from './types';
import type {
  BookableResource,
  CreateResourceReservationInput,
  ListResourceReservationsQuery,
  PracticeRoomRow,
  RequestResourceReservationInput,
  ResourceReservation,
  RoomReservationRow,
  UpsertBookableResourceInput,
} from './types';
import { dayRangeSeoul } from './seoulTime';

type ReservationQueryRow = RoomReservationRow & {
  bookable_resources?: { name: string; kind: string } | null;
};

function client() {
  return getCoreClient();
}

export function toPracticeRoomRow(resource: BookableResource): PracticeRoomRow {
  return {
    id: resource.id,
    organization_id: resource.organization_id,
    name: resource.name,
    capacity: resource.capacity,
    open_time: resource.open_time,
    close_time: resource.close_time,
    is_active: resource.is_active,
    memo: resource.memo,
  };
}

export function toRoomReservationRow(row: ReservationQueryRow): RoomReservationRow {
  const name = row.practice_rooms?.name || row.bookable_resources?.name;
  return {
    ...row,
    practice_rooms: name ? { name } : row.practice_rooms ?? null,
  };
}

export function toResourceReservation(row: ReservationQueryRow): ResourceReservation {
  const mapped = toRoomReservationRow(row);
  return {
    id: mapped.id,
    organization_id: mapped.organization_id,
    resourceId: mapped.room_id,
    customer_id: mapped.customer_id,
    requested_by: mapped.requested_by,
    starts_at: mapped.starts_at,
    ends_at: mapped.ends_at,
    status: mapped.status,
    memo: mapped.memo,
    reviewed_by: mapped.reviewed_by,
    reviewed_at: mapped.reviewed_at,
    created_at: mapped.created_at,
    resourceName: mapped.practice_rooms?.name,
    resourceKind: row.bookable_resources?.kind,
    customerName: mapped.customers?.name,
  };
}

export async function listBookableResources(params: {
  organizationId: string;
  kind?: string;
}): Promise<BookableResource[]> {
  const { data, error } = await client().rpc('list_org_bookable_resources' as never, {
    p_org_id: params.organizationId,
    p_kind: params.kind ?? null,
  } as never);
  if (error) throw new Error(error.message || '자원 목록을 불러오지 못했습니다.');
  return ((data as BookableResource[] | null) ?? []).map((row) => ({
    ...row,
    metadata:
      row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata
        : {},
  }));
}

export async function upsertBookableResource(params: UpsertBookableResourceInput): Promise<string> {
  if (params.kind === PRACTICE_ROOM_RESOURCE_KIND) {
    const { data, error } = await client().rpc('upsert_practice_room' as never, {
      p_org_id: params.organizationId,
      p_name: params.name,
      p_capacity: params.capacity ?? 1,
      p_open_time: params.openTime ?? '09:00',
      p_close_time: params.closeTime ?? '22:00',
      p_id: params.id ?? null,
    } as never);
    if (error) throw new Error(error.message || '자원 저장에 실패했습니다.');
    return data as string;
  }

  const { data, error } = await client().rpc('upsert_bookable_resource' as never, {
    p_org_id: params.organizationId,
    p_kind: params.kind,
    p_name: params.name,
    p_capacity: params.capacity ?? 1,
    p_open_time: params.openTime ?? '09:00',
    p_close_time: params.closeTime ?? '22:00',
    p_id: params.id ?? null,
    p_memo: params.memo ?? null,
  } as never);
  if (error) throw new Error(error.message || '자원 저장에 실패했습니다.');
  return data as string;
}

export async function listResourceReservationRows(
  query: ListResourceReservationsQuery
): Promise<ReservationQueryRow[]> {
  let builder = client()
    .from('room_reservations')
    .select('*, bookable_resources(name, kind), customers(name)')
    .eq('organization_id', query.organizationId)
    .order('starts_at', { ascending: query.order !== 'desc' })
    .limit(query.limit ?? 200);

  if (query.customerId) builder = builder.eq('customer_id', query.customerId);
  if (query.fromIso) builder = builder.gte('starts_at', query.fromIso);
  if (query.toIso) builder = builder.lte('starts_at', query.toIso);
  if (Array.isArray(query.status)) builder = builder.in('status', query.status);
  else if (query.status) builder = builder.eq('status', query.status);

  const { data, error } = await builder;
  if (error) throw new Error(error.message || '예약 목록을 불러오지 못했습니다.');
  return (data || []) as ReservationQueryRow[];
}

export async function listResourceReservations(
  query: ListResourceReservationsQuery
): Promise<ResourceReservation[]> {
  const rows = await listResourceReservationRows(query);
  return rows.map(toResourceReservation);
}

export function listActiveResourceReservationRows(
  organizationId: string,
  fromIso: string,
  toIso?: string
) {
  return listResourceReservationRows({
    organizationId,
    status: [...RESOURCE_RESERVATION_BLOCKING_STATUSES],
    fromIso,
    toIso,
    order: 'asc',
  });
}

export async function requestResourceReservation(
  params: RequestResourceReservationInput
): Promise<string> {
  const { data, error } = await client().rpc('request_room_reservation' as never, {
    p_org_id: params.organizationId,
    p_room_id: params.resourceId,
    p_starts_at: params.startsAt,
    p_ends_at: params.endsAt,
    p_memo: params.memo ?? null,
  } as never);
  if (error) throw mapResourceReservationError(error.message, '예약 신청에 실패했습니다.');
  return data as string;
}

export async function createStaffResourceReservation(
  params: CreateResourceReservationInput
): Promise<string> {
  const { data, error } = await client().rpc('create_staff_room_reservation' as never, {
    p_org_id: params.organizationId,
    p_room_id: params.resourceId,
    p_customer_id: params.customerId,
    p_starts_at: params.startsAt,
    p_ends_at: params.endsAt,
    p_memo: params.memo ?? null,
  } as never);
  if (error) throw mapResourceReservationError(error.message, '예약 저장에 실패했습니다.');
  return data as string;
}

export async function cancelResourceReservation(reservationId: string): Promise<void> {
  const { error } = await client().rpc('cancel_my_room_reservation' as never, {
    p_reservation_id: reservationId,
  } as never);
  if (error) throw new Error(error.message || '예약 취소에 실패했습니다.');
}

export async function reviewResourceReservation(
  reservationId: string,
  approve: boolean,
  memo?: string
): Promise<void> {
  const { error } = await client().rpc('review_room_reservation' as never, {
    p_reservation_id: reservationId,
    p_approve: approve,
    p_memo: memo ?? null,
  } as never);
  if (error) throw mapResourceReservationError(error.message, '예약 처리에 실패했습니다.');
}

export async function listPracticeRooms(organizationId: string): Promise<PracticeRoomRow[]> {
  const rows = await listBookableResources({
    organizationId,
    kind: PRACTICE_ROOM_RESOURCE_KIND,
  });
  return rows.map(toPracticeRoomRow);
}

export async function listReservationsByDate(organizationId: string, date: string) {
  const { start, end } = dayRangeSeoul(date);
  const rows = await listActiveResourceReservationRows(organizationId, start, end);
  return rows.map(toRoomReservationRow);
}

export async function listReservationsByRange(
  organizationId: string,
  startDate: string,
  endDate: string
) {
  const { start } = dayRangeSeoul(startDate);
  const { end } = dayRangeSeoul(endDate);
  const rows = await listActiveResourceReservationRows(organizationId, start, end);
  return rows.map(toRoomReservationRow);
}
