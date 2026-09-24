/** 브라우저 로컬 타임존 기준 날짜 유틸 (출결·레슨·대시보드 통일) */

export function todayIsoLocal(now: Date = new Date()): string {
  return formatIsoDateLocal(now);
}

export function yearMonthLocal(now: Date = new Date()): string {
  return formatIsoDateLocal(now).slice(0, 7);
}

export function formatIsoDateLocal(date: Date): string {
  return formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function shiftDateIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatIsoDateLocal(d);
}

/** 로컬 달력 자정 */
export function startOfLocalDay(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** 로컬 다음날 자정 (당일 조회 exclusive end) */
export function startOfNextLocalDay(now: Date = new Date()): Date {
  const d = startOfLocalDay(now);
  d.setDate(d.getDate() + 1);
  return d;
}

/** 로컬 기준 이번 주 월요일 YYYY-MM-DD */
export function weekStartIsoLocal(now: Date = new Date()): string {
  const d = startOfLocalDay(now);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatIsoDateLocal(d);
}

function formatDateParts(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}
