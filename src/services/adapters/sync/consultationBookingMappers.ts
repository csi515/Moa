import type { Json } from '../../../lib/supabase/database.types';
import {
  DEFAULT_CONSULTATION_BOOKING_SETTINGS,
  type ConsultationBookingRequest,
  type ConsultationBookingSettings,
  type ConsultationRequestStatus,
} from '../../../core/consultations/types';

interface ConsultationBookingRequestRow {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  content: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
}

export function parseConsultationBookingSettings(
  settings: Json | null | undefined
): ConsultationBookingSettings {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return DEFAULT_CONSULTATION_BOOKING_SETTINGS;
  }
  const root = settings as Record<string, unknown>;
  const raw = root.consultationBooking;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_CONSULTATION_BOOKING_SETTINGS;
  }
  return {
    ...DEFAULT_CONSULTATION_BOOKING_SETTINGS,
    ...(raw as ConsultationBookingSettings),
  };
}

export function consultationBookingRequestRowToApp(
  row: ConsultationBookingRequestRow
): ConsultationBookingRequest {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    content: row.content,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    status: row.status as ConsultationRequestStatus,
    adminMemo: row.admin_memo ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function consultationBookingRequestToRow(
  req: ConsultationBookingRequest,
  organizationId: string
): ConsultationBookingRequestRow {
  return {
    id: req.id,
    organization_id: organizationId,
    name: req.name,
    phone: req.phone,
    content: req.content,
    preferred_date: req.preferredDate,
    preferred_time: req.preferredTime,
    status: req.status,
    admin_memo: req.adminMemo ?? null,
    created_at: req.createdAt,
    updated_at: req.updatedAt ?? req.createdAt,
  };
}
