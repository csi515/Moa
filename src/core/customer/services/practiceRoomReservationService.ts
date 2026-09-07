import { getCoreClient } from '@/lib/supabase';

export type RoomReservationStatus =
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'rejected'
  | 'completed';

export interface PracticeRoomRow {
  id: string;
  organization_id: string;
  name: string;
  capacity: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
  memo?: string | null;
}

export interface RoomReservationRow {
  id: string;
  organization_id: string;
  room_id: string;
  customer_id: string;
  requested_by: string;
  starts_at: string;
  ends_at: string;
  status: RoomReservationStatus;
  memo?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  practice_rooms?: { name: string } | null;
  customers?: { name: string } | null;
}

/** Asia/Seoul 고정 오프셋 (v1) */
export function toSeoulIso(date: string, time: string): string {
  return `${date}T${time}:00+09:00`;
}

export function seoulDateFromIso(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function seoulTimeFromIso(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso.slice(11, 16);
  }
}

function client() {
  return getCoreClient();
}

function dayRangeSeoul(date: string): { start: string; end: string } {
  return {
    start: `${date}T00:00:00+09:00`,
    end: `${date}T23:59:59.999+09:00`,
  };
}

/** 연습실 예약 Service — canonical room_reservations only (Phase 3A) */
export const practiceRoomReservationService = {
  async listRooms(organizationId: string): Promise<PracticeRoomRow[]> {
    const { data, error } = await client().rpc('list_org_practice_rooms' as never, {
      p_org_id: organizationId,
    } as never);
    if (error) throw new Error(error.message || '연습실 목록을 불러오지 못했습니다.');
    return (data as unknown as PracticeRoomRow[]) || [];
  },

  async upsertRoom(params: {
    organizationId: string;
    name: string;
    capacity?: number;
    openTime?: string;
    closeTime?: string;
    id?: string;
  }): Promise<string> {
    const { data, error } = await client().rpc('upsert_practice_room' as never, {
      p_org_id: params.organizationId,
      p_name: params.name,
      p_capacity: params.capacity ?? 1,
      p_open_time: params.openTime ?? '09:00',
      p_close_time: params.closeTime ?? '22:00',
      p_id: params.id ?? null,
    } as never);
    if (error) throw new Error(error.message || '연습실 저장에 실패했습니다.');
    return data as string;
  },

  async listMyReservations(organizationId: string): Promise<RoomReservationRow[]> {
    const { data, error } = await client()
      .from('room_reservations')
      .select('*, practice_rooms(name), customers(name)')
      .eq('organization_id', organizationId)
      .order('starts_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message || '예약 목록을 불러오지 못했습니다.');
    return (data || []) as RoomReservationRow[];
  },

  /** 학부모·스태프: 특정 원생(customer)의 향후 예약 */
  async listForCustomer(
    organizationId: string,
    customerId: string,
    options?: { fromDate?: string; limit?: number }
  ): Promise<RoomReservationRow[]> {
    const from = options?.fromDate || new Date().toISOString().slice(0, 10);
    const { start } = dayRangeSeoul(from);
    const { data, error } = await client()
      .from('room_reservations')
      .select('*, practice_rooms(name), customers(name)')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .in('status', ['pending', 'approved'])
      .gte('starts_at', start)
      .order('starts_at', { ascending: true })
      .limit(options?.limit ?? 20);
    if (error) throw new Error(error.message || '예약 목록을 불러오지 못했습니다.');
    return (data || []) as RoomReservationRow[];
  },

  /** 스태프: 해당 날짜의 활성 예약 (pending + approved) */
  async listByDate(organizationId: string, date: string): Promise<RoomReservationRow[]> {
    const { start, end } = dayRangeSeoul(date);
    const { data, error } = await client()
      .from('room_reservations')
      .select('*, practice_rooms(name), customers(name)')
      .eq('organization_id', organizationId)
      .in('status', ['pending', 'approved'])
      .gte('starts_at', start)
      .lte('starts_at', end)
      .order('starts_at', { ascending: true });
    if (error) throw new Error(error.message || '일자별 예약을 불러오지 못했습니다.');
    return (data || []) as RoomReservationRow[];
  },

  async listPending(organizationId: string): Promise<RoomReservationRow[]> {
    const { data, error } = await client()
      .from('room_reservations')
      .select('*, practice_rooms(name), customers(name)')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('starts_at', { ascending: true });
    if (error) throw new Error(error.message || '대기 예약을 불러오지 못했습니다.');
    return (data || []) as RoomReservationRow[];
  },

  async request(params: {
    organizationId: string;
    roomId: string;
    startsAt: string;
    endsAt: string;
    memo?: string;
  }): Promise<string> {
    const { data, error } = await client().rpc('request_room_reservation' as never, {
      p_org_id: params.organizationId,
      p_room_id: params.roomId,
      p_starts_at: params.startsAt,
      p_ends_at: params.endsAt,
      p_memo: params.memo ?? null,
    } as never);
    if (error) throw mapReservationError(error.message, '예약 신청에 실패했습니다.');
    return data as string;
  },

  /** 스태프 즉시 예약 (approved) */
  async createStaff(params: {
    organizationId: string;
    roomId: string;
    customerId: string;
    startsAt: string;
    endsAt: string;
    memo?: string;
  }): Promise<string> {
    const { data, error } = await client().rpc('create_staff_room_reservation' as never, {
      p_org_id: params.organizationId,
      p_room_id: params.roomId,
      p_customer_id: params.customerId,
      p_starts_at: params.startsAt,
      p_ends_at: params.endsAt,
      p_memo: params.memo ?? null,
    } as never);
    if (error) throw mapReservationError(error.message, '예약 저장에 실패했습니다.');
    return data as string;
  },

  async cancel(reservationId: string): Promise<void> {
    const { error } = await client().rpc('cancel_my_room_reservation' as never, {
      p_reservation_id: reservationId,
    } as never);
    if (error) throw new Error(error.message || '예약 취소에 실패했습니다.');
  },

  async review(reservationId: string, approve: boolean, memo?: string): Promise<void> {
    const { error } = await client().rpc('review_room_reservation' as never, {
      p_reservation_id: reservationId,
      p_approve: approve,
      p_memo: memo ?? null,
    } as never);
    if (error) throw mapReservationError(error.message, '예약 처리에 실패했습니다.');
  },
};

function mapReservationError(message: string, fallback: string): Error {
  if (message.includes('already reserved') || message.includes('overlap') || message.includes('conflicts')) {
    return new Error('이미 예약된 시간대입니다.');
  }
  if (message.includes('Overnight')) {
    return new Error('자정을 넘는 예약은 할 수 없습니다.');
  }
  if (message.includes('operating hours') || message.includes('Outside room')) {
    return new Error('연습실 운영 시간 외에는 예약할 수 없습니다.');
  }
  if (message.includes('closed')) {
    return new Error('학원 휴무일에는 예약할 수 없습니다.');
  }
  if (message.includes('Permission denied')) {
    return new Error('권한이 없습니다.');
  }
  return new Error(message || fallback);
}
