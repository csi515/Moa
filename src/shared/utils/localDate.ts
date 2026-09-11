/** 브라우저 로컬 타임존 기준 날짜 유틸 (출결·레슨·대시보드 통일) */

export function todayIsoLocal(): string {
  const d = new Date();
  return formatDateParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function yearMonthLocal(): string {
  return todayIsoLocal().slice(0, 7);
}

export function formatIsoDateLocal(date: Date): string {
  return formatDateParts(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function shiftDateIso(dateIso: string, days: number): string {
  const d = new Date(`${dateIso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return formatIsoDateLocal(d);
}

function formatDateParts(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}
