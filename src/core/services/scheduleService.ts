import { StorageService } from '@/services/storage';
import type { Booking, BookingStatus, ServiceOffering } from '../types/schedule';

/** Core 예약·수업 종류 도메인 서비스 */
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

  updateBookingStatus(id: string, status: BookingStatus): Booking | null {
    return StorageService.updateBookingStatus(id, status);
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
};
