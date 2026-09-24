/** Asia/Seoul 고정 오프셋 (v1) */
export function toSeoulIso(date: string, time: string): string {
  return `${date}T${time}:00+09:00`;
}

export function seoulDateFromIso(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function seoulTimeFromIso(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso.slice(11, 16);
  }
}

export function dayRangeSeoul(date: string): { start: string; end: string } {
  return {
    start: `${date}T00:00:00+09:00`,
    end: `${date}T23:59:59.999+09:00`,
  };
}
