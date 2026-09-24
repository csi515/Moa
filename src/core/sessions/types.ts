export const CUSTOMER_SESSION_STATUSES = ['active', 'completed', 'cancelled'] as const;
export type CustomerSessionStatus = (typeof CUSTOMER_SESSION_STATUSES)[number];

export const CUSTOMER_SESSION_SOURCES = ['walk_in', 'booking', 'kiosk', 'other'] as const;
export type CustomerSessionSource = (typeof CUSTOMER_SESSION_SOURCES)[number];

export type CustomerSession = {
  id: string;
  organizationId: string;
  customerId: string;
  startedAt: string;
  endedAt?: string;
  status: CustomerSessionStatus;
  source: string;
  context?: string;
  staffId?: string;
  bookingId?: string;
  reservationId?: string;
  passId?: string;
  paymentId?: string;
  resourceId?: string;
  memo?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSessionStartInput = {
  customerId: string;
  staffId?: string;
  source?: string;
  context?: string;
  bookingId?: string;
  reservationId?: string;
  passId?: string;
  paymentId?: string;
  resourceId?: string;
  memo?: string;
  metadata?: Record<string, unknown>;
};

export type CustomerSessionListQuery = {
  customerId?: string;
  status?: CustomerSessionStatus;
  limit?: number;
};

export type CustomerSessionMutationAction = 'created' | 'completed' | 'cancelled' | 'idempotent';

export type CustomerSessionMutationResult = {
  action: CustomerSessionMutationAction;
  session: CustomerSession;
};
