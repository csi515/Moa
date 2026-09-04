import { StorageService } from '@/services/storage';
import type {
  Booking,
  BookingStatus,
  ServiceOffering,
  SessionPass,
  SlotRecruitment,
} from '../types/schedule';
import { getSlotCapacityInfo } from '@/core/schedules/bookingCapacity';
import { sumRemainingSessions } from '@/core/schedules/sessionPassUtils';

/** Core 예약·수업 종류·이용권 도메인 서비스 */
export const ScheduleService = {
  getBookings(): Booking[] {
    return StorageService.getBookings();
  },

  getBookingsByDate(date: string): Booking[] {
    return StorageService.getBookings().filter((b) => b.startsAt.startsWith(date));
  },

  getUpcomingBookings(limit = 10): Booking[] {
    const now = new Date().toISOString();
    return StorageService.getBookings()
      .filter((b) => b.startsAt >= now && b.status !== 'cancelled')
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, limit);
  },

  saveBooking(booking: Omit<Booking, 'id'> & { id?: string }): Booking {
    return StorageService.saveBooking(booking);
  },

  /**
   * 예약 상태 변경.
   * completed 전환 시 이용권 1회 차감, completed→다른 상태 시 복구.
   */
  updateBookingStatus(id: string, status: BookingStatus): Booking | null {
    const existing = StorageService.getBookings().find((b) => b.id === id);
    if (!existing) return null;

    let sessionPassId = existing.sessionPassId;

    if (status === 'completed' && existing.status !== 'completed' && !sessionPassId) {
      sessionPassId = StorageService.consumeSessionPass(existing.customerId) ?? undefined;
    }

    if (
      existing.status === 'completed' &&
      status !== 'completed' &&
      existing.sessionPassId
    ) {
      StorageService.refundSessionPass(existing.sessionPassId);
      sessionPassId = undefined;
    }

    const updated = StorageService.saveBooking({
      ...existing,
      status,
      sessionPassId,
    });
    return updated;
  },

  deleteBooking(id: string): boolean {
    return StorageService.deleteBooking(id);
  },

  getServiceOfferings(): ServiceOffering[] {
    return StorageService.getServiceOfferings();
  },

  getActiveServiceOfferings(): ServiceOffering[] {
    return StorageService.getServiceOfferings().filter((s) => s.isActive);
  },

  saveServiceOffering(offering: Omit<ServiceOffering, 'id'> & { id?: string }): ServiceOffering {
    return StorageService.saveServiceOffering(offering);
  },

  deleteServiceOffering(id: string): boolean {
    return StorageService.deleteServiceOffering(id);
  },

  getSessionPasses(): SessionPass[] {
    return StorageService.getSessionPasses();
  },

  getCustomerSessionPasses(customerId: string): SessionPass[] {
    return StorageService.getSessionPasses().filter((p) => p.customerId === customerId);
  },

  getCustomerRemainingSessions(customerId: string): number {
    return sumRemainingSessions(StorageService.getSessionPasses(), customerId);
  },

  saveSessionPass(pass: Omit<SessionPass, 'id'> & { id?: string }): SessionPass {
    return StorageService.saveSessionPass(pass);
  },

  deleteSessionPass(id: string): boolean {
    return StorageService.deleteSessionPass(id);
  },

  getSlotRecruitments(): SlotRecruitment[] {
    return StorageService.getSlotRecruitments();
  },

  setSlotRecruitmentClosed(
    serviceId: string,
    staffId: string | null | undefined,
    startsAt: string,
    closedManually: boolean
  ) {
    return StorageService.setSlotRecruitmentClosed(serviceId, staffId, startsAt, closedManually);
  },

  getSlotCapacity(serviceId: string, staffId: string | null | undefined, startsAt: string) {
    const service = this.getServiceOfferings().find((s) => s.id === serviceId);
    if (!service) return null;
    return getSlotCapacityInfo({
      service,
      staffId,
      startsAt,
      bookings: this.getBookings(),
      recruitments: this.getSlotRecruitments(),
    });
  },
};
