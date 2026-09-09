import type { DayOfWeek, StaffWorkWindow } from '@/types';

const DAY_BY_INDEX: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토'];

function localParts(iso: string): { day: DayOfWeek; hm: string } | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const hm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return { day: DAY_BY_INDEX[date.getDay()], hm };
}

/** 근무창이 없으면 제한 없음. 있으면 시작·종료가 같은 요일 창 안에 있어야 한다 */
export function isOutsideStaffHours(params: {
  staffId?: string;
  startsAt: string;
  endsAt: string;
  windows?: StaffWorkWindow[];
}): boolean {
  if (!params.staffId) return false;
  const mine = (params.windows || []).filter(
    (window) => window.staffId === params.staffId && window.days.length > 0 && window.startTime && window.endTime
  );
  if (mine.length === 0) return false;
  const start = localParts(params.startsAt);
  const end = localParts(params.endsAt);
  if (!start || !end) return true;
  return !mine.some(
    (window) =>
      window.days.includes(start.day) &&
      start.day === end.day &&
      start.hm >= window.startTime &&
      end.hm <= window.endTime
  );
}
