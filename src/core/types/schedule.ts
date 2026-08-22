/** Core schedule / booking types (core.schedules, core.services) */

export type BookingStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface ServiceOffering {
  id: string;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  maxCapacity: number;
  category: 'private' | 'group' | 'reformer' | 'other';
  isActive: boolean;
  isSchedulable: boolean;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  staffId?: string;
  staffName?: string;
  serviceId?: string;
  serviceName?: string;
  startsAt: string;
  endsAt: string;
  status: BookingStatus;
  memo?: string;
  createdAt?: string;
}
