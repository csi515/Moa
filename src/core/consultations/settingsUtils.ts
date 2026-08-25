import {
  DEFAULT_CONSULTATION_BOOKING_SETTINGS,
  type ConsultationBookingSettings,
} from './types';

/** org.settings.consultationBooking → 앱 설정 객체 */
export function normalizeConsultationBookingSettings(
  raw?: Partial<ConsultationBookingSettings>
): ConsultationBookingSettings {
  if (!raw) return DEFAULT_CONSULTATION_BOOKING_SETTINGS;
  return {
    ...DEFAULT_CONSULTATION_BOOKING_SETTINGS,
    ...raw,
    weeklyAvailability:
      raw.weeklyAvailability?.length === 7
        ? raw.weeklyAvailability
        : DEFAULT_CONSULTATION_BOOKING_SETTINGS.weeklyAvailability,
    blockedDates: raw.blockedDates ?? [],
  };
}
