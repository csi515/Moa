import type { Page } from '@playwright/test';

const KEYS = {
  students: 'piano_app_students',
  classes: 'piano_app_classes',
  attendance: 'piano_app_attendance',
} as const;

function readJsonArray(page: Page, key: string): Promise<unknown[]> {
  return page.evaluate((k) => {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, key);
}

export async function snapshotAttendance(page: Page): Promise<string> {
  const rows = await readJsonArray(page, KEYS.attendance);
  return JSON.stringify(rows);
}

export async function findStudentByName(
  page: Page,
  name: string
): Promise<{ id: string; classIds: string[] } | null> {
  return page.evaluate(
    ({ key, studentName }) => {
      try {
        const raw = localStorage.getItem(key);
        const list = raw ? (JSON.parse(raw) as Array<{ id: string; name: string; classIds?: string[] }>) : [];
        const hit = list.find((s) => s.name === studentName);
        if (!hit) return null;
        return { id: hit.id, classIds: hit.classIds || [] };
      } catch {
        return null;
      }
    },
    { key: KEYS.students, studentName: name }
  );
}

export async function getClassCount(page: Page): Promise<number> {
  const rows = await readJsonArray(page, KEYS.classes);
  return rows.length;
}
