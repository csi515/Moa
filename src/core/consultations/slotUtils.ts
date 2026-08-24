import type { DayOfWeek } from '@/types';
import type { BookedSlot, ConsultationBookingSettings } from './types';

const DAY_INDEX: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];

export function getDayOfWeekFromDate(dateStr: string): DayOfWeek {
  const date = new Date(`${dateStr}T12:00:00`);
  return DAY_INDEX[date.getDay()];
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 시작~종료 구간을 slotMinutes 간격으로 분할 */
export function generateTimeSlots(startTime: string, endTime: string, slotMinutes: number): string[] {
  const start = parseMinutes(startTime);
  const end = parseMinutes(endTime);
  if (slotMinutes <= 0 || end <= start) return [];

  const slots: string[] = [];
  for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
    slots.push(formatMinutes(t));
  }
  return slots;
}

export function getAvailableSlotsForDate(
  date: string,
  settings: ConsultationBookingSettings,
  bookedSlots: BookedSlot[]
): string[] {
  if (settings.blockedDates.includes(date)) return [];

  const dayConfig = settings.weeklyAvailability.find(
    (d) => d.dayOfWeek === getDayOfWeekFromDate(date)
  );
  if (!dayConfig?.enabled) return [];

  const allSlots = generateTimeSlots(
    dayConfig.startTime,
    dayConfig.endTime,
    settings.slotMinutes
  );

  const booked = new Set(
    bookedSlots.filter((slot) => slot.date === date).map((slot) => slot.time)
  );

  const today = new Date().toISOString().slice(0, 10);
  const nowMinutes =
    date === today ? new Date().getHours() * 60 + new Date().getMinutes() : -1;

  return allSlots.filter((time) => {
    if (booked.has(time)) return false;
    if (nowMinutes >= 0 && parseMinutes(time) <= nowMinutes) return false;
    return true;
  });
}

/** 오늘부터 daysAhead일까지 상담 가능한 날짜 목록 */
export function getSelectableDates(
  settings: ConsultationBookingSettings,
  bookedSlots: BookedSlot[],
  daysAhead = 21
): string[] {
  const dates: string[] = [];
  const cursor = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (getAvailableSlotsForDate(dateStr, settings, bookedSlots).length > 0) {
      dates.push(dateStr);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}
