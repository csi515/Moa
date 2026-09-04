import { getCoreClient } from '@/lib/supabase';
import type {
  Reservation,
  ReservationDetail,
  MyReservation,
  ReservationRequest,
  ReservationStatus,
} from '@/types';

/**
 * Reservation Service
 * 예약 신청 및 관리
 */
export const reservationService = {
  /**
   * 예약 신청 (고객)
   */
  async requestReservation(request: ReservationRequest): Promise<string> {
    const { data, error } = await getCoreClient()
      .rpc('request_reservation', {
        p_schedule_id: request.schedule_id,
        p_applicant_name: request.applicant_name,
        p_applicant_phone: request.applicant_phone ?? null,
        p_applicant_email: request.applicant_email ?? null,
        p_request_message: request.request_message ?? null,
      });

    if (error) throw error;
    return data as string;
  },

  /**
   * 예약 확정 (원장/관리자)
   */
  async confirmReservation(reservationId: string): Promise<void> {
    const { error } = await getCoreClient()
      .rpc('confirm_reservation', {
        p_reservation_id: reservationId,
      });

    if (error) throw error;
  },

  /**
   * 예약 취소
   */
  async cancelReservation(reservationId: string, reason?: string): Promise<void> {
    const { error } = await getCoreClient()
      .rpc('cancel_reservation', {
        p_reservation_id: reservationId,
        p_cancel_reason: reason ?? null,
      });

    if (error) throw error;
  },

  /**
   * 조직의 예약 목록 조회 (원장/관리자)
   */
  async getOrganizationReservations(
    organizationId: string,
    status?: ReservationStatus,
    fromDate?: Date,
    limit = 100,
    offset = 0
  ): Promise<ReservationDetail[]> {
    const { data, error } = await getCoreClient()
      .rpc('get_organization_reservations', {
        p_org_id: organizationId,
        p_status: status ?? null,
        p_from_date: fromDate ? fromDate.toISOString() : null,
        p_limit: limit,
        p_offset: offset,
      });

    if (error) throw error;
    return (data ?? []) as ReservationDetail[];
  },

  /**
   * 내 예약 목록 조회 (고객)
   */
  async getMyReservations(status?: ReservationStatus, limit = 50): Promise<MyReservation[]> {
    const { data, error } = await getCoreClient()
      .rpc('get_my_reservations', {
        p_status: status ?? null,
        p_limit: limit,
      });

    if (error) throw error;
    return (data ?? []) as MyReservation[];
  },

  /**
   * 예약 상세 조회
   */
  async getReservation(reservationId: string): Promise<Reservation> {
    const { data, error } = await getCoreClient()
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 조직의 미확정 예약 개수 조회
   */
  async getPendingReservationCount(organizationId: string): Promise<number> {
    const { count, error } = await getCoreClient()
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'requested');

    if (error) throw error;
    return count ?? 0;
  },
};
