import type { Page } from '@playwright/test';

/**
 * 앱 localStorage 캐시 읽기 (E2E 전용).
 * 로그인 후 캐시 키는 org 스코프다: `${baseKey}_${organizationId}` (src/services/adapters/storageContext.ts
 * resolveStorageKey). org 컨텍스트가 없을 때만 baseKey 그대로 쓴다.
 */
const KEYS = {
  students: 'piano_app_students',
  classes: 'piano_app_classes',
  attendance: 'piano_app_attendance',
} as const;

/** org 스코프 키(`base_<uuid>`) 우선, 없으면 base 키. 배열이 아니면 빈 배열. */
function readJsonArray(page: Page, baseKey: string): Promise<unknown[]> {
  return page.evaluate((base) => {
    const scoped = new RegExp(
      `^${base}_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`,
      'i'
    );
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && scoped.test(k)) keys.push(k);
    }
    if (keys.length === 0 && localStorage.getItem(base) !== null) keys.push(base);
    const out: unknown[] = [];
    for (const k of keys) {
      try {
        const parsed = JSON.parse(localStorage.getItem(k) || '[]');
        if (Array.isArray(parsed)) out.push(...parsed);
      } catch {
        // 손상된 캐시는 무시
      }
    }
    return out;
  }, baseKey);
}

export async function snapshotAttendance(page: Page): Promise<string> {
  const rows = await readJsonArray(page, KEYS.attendance);
  return JSON.stringify(rows);
}

export async function findStudentByName(
  page: Page,
  name: string
): Promise<{ id: string; classIds: string[] } | null> {
  const list = (await readJsonArray(page, KEYS.students)) as Array<{
    id: string;
    name: string;
    classIds?: string[];
  }>;
  const hit = list.find((s) => s && s.name === name);
  if (!hit) return null;
  return { id: hit.id, classIds: hit.classIds || [] };
}

export async function getClassCount(page: Page): Promise<number> {
  const rows = await readJsonArray(page, KEYS.classes);
  return rows.length;
}
