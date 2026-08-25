import { STORAGE_KEYS } from '../adapters';
import { generateEntityId, getItem, setItem } from './helpers';
import {
  DEFAULT_CONSULTATION_BOOKING_SETTINGS,
  type ConsultationBookingRequest,
  type ConsultationBookingSettings,
  type ConsultationRequestStatus,
} from '../../core/consultations/types';

/** 상담 예약 설정·신청 (코어) */
export function createConsultationBookingStorage() {
  return {
    getConsultationBookingSettings(): ConsultationBookingSettings {
      return getItem<ConsultationBookingSettings>(
        STORAGE_KEYS.CONSULTATION_BOOKING_SETTINGS,
        DEFAULT_CONSULTATION_BOOKING_SETTINGS
      );
    },

    saveConsultationBookingSettings(
      settings: ConsultationBookingSettings
    ): ConsultationBookingSettings {
      setItem(STORAGE_KEYS.CONSULTATION_BOOKING_SETTINGS, settings);
      return settings;
    },

    getConsultationBookingRequests(): ConsultationBookingRequest[] {
      return getItem<ConsultationBookingRequest[]>(STORAGE_KEYS.CONSULTATION_BOOKING_REQUESTS, []);
    },

    saveConsultationBookingRequest(
      req: Omit<ConsultationBookingRequest, 'id' | 'createdAt' | 'updatedAt'> & {
        id?: string;
        createdAt?: string;
      }
    ): ConsultationBookingRequest {
      const list = this.getConsultationBookingRequests();
      const now = new Date().toISOString();
      let saved: ConsultationBookingRequest;

      if (req.id) {
        const idx = list.findIndex((item) => item.id === req.id);
        if (idx >= 0) {
          saved = { ...list[idx], ...req, id: req.id, updatedAt: now };
          list[idx] = saved;
        } else {
          saved = { ...req, id: req.id, createdAt: req.createdAt ?? now };
          list.unshift(saved);
        }
      } else {
        saved = {
          ...req,
          id: generateEntityId('cbr'),
          createdAt: now,
        };
        list.unshift(saved);
      }

      setItem(STORAGE_KEYS.CONSULTATION_BOOKING_REQUESTS, list);
      return saved;
    },

    updateConsultationBookingRequestStatus(
      id: string,
      status: ConsultationRequestStatus,
      adminMemo?: string
    ): ConsultationBookingRequest | null {
      const list = this.getConsultationBookingRequests();
      const idx = list.findIndex((item) => item.id === id);
      if (idx < 0) return null;

      const updated: ConsultationBookingRequest = {
        ...list[idx],
        status,
        adminMemo: adminMemo ?? list[idx].adminMemo,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      setItem(STORAGE_KEYS.CONSULTATION_BOOKING_REQUESTS, list);
      return updated;
    },

    deleteConsultationBookingRequest(id: string): boolean {
      const list = this.getConsultationBookingRequests();
      const filtered = list.filter((item) => item.id !== id);
      if (filtered.length === list.length) return false;
      setItem(STORAGE_KEYS.CONSULTATION_BOOKING_REQUESTS, filtered);
      return true;
    },

    getPendingConsultationBookingCount(): number {
      return this.getConsultationBookingRequests().filter((r) => r.status === 'pending').length;
    },
  };
}

export type ConsultationBookingStorage = ReturnType<typeof createConsultationBookingStorage>;
