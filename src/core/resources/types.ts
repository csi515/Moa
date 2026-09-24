export const PRACTICE_ROOM_RESOURCE_KIND = 'practice_room';

export const RESOURCE_RESERVATION_BLOCKING_STATUSES = ['pending', 'approved'] as const;

export type ResourceReservationStatus =
  | 'pending'
  | 'approved'
  | 'cancelled'
  | 'rejected'
  | 'completed';

export type BookableResource = {
  id: string;
  organization_id: string;
  kind: string;
  name: string;
  capacity: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
  memo?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ResourceReservation = {
  id: string;
  organization_id: string;
  resourceId: string;
  customer_id: string;
  requested_by: string;
  starts_at: string;
  ends_at: string;
  status: ResourceReservationStatus;
  memo?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  resourceName?: string;
  resourceKind?: string;
  customerName?: string;
};

/** Piano UI 호환 — room_id = bookable_resources.id */
export type PracticeRoomRow = {
  id: string;
  organization_id: string;
  name: string;
  capacity: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
  memo?: string | null;
};

export type RoomReservationRow = {
  id: string;
  organization_id: string;
  room_id: string;
  customer_id: string;
  requested_by: string;
  starts_at: string;
  ends_at: string;
  status: ResourceReservationStatus;
  memo?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  practice_rooms?: { name: string } | null;
  customers?: { name: string } | null;
};

export type UpsertBookableResourceInput = {
  organizationId: string;
  kind: string;
  name: string;
  capacity?: number;
  openTime?: string;
  closeTime?: string;
  id?: string;
  memo?: string;
};

export type CreateResourceReservationInput = {
  organizationId: string;
  resourceId: string;
  customerId: string;
  startsAt: string;
  endsAt: string;
  memo?: string;
};

export type RequestResourceReservationInput = {
  organizationId: string;
  resourceId: string;
  startsAt: string;
  endsAt: string;
  memo?: string;
};

export type ListResourceReservationsQuery = {
  organizationId: string;
  customerId?: string;
  status?: ResourceReservationStatus | ResourceReservationStatus[];
  fromIso?: string;
  toIso?: string;
  limit?: number;
  order?: 'asc' | 'desc';
};
