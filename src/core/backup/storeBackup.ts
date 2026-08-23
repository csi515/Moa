import { STORAGE_KEYS } from '@/services/adapters/storageKeys';
import { getItem, setItem, DEFAULT_SETTINGS } from '@/services/storage/helpers';
import { getIndustryType } from '@/services/adapters/storageContext';
import { normalizeIndustryType, getIndustryLabel } from '@/core/industry/types';
import type { AcademySettings } from '@/types';

const LAST_BACKUP_KEY = 'moa_last_store_backup_at';
export const BACKUP_FORMAT_VERSION = 2;

export interface StoreBackupPayload {
  version: number;
  exportedAt: string;
  industryType: string;
  organizationName: string;
  [key: string]: unknown;
}

/** 매장 전체 데이터를 JSON 문자열로 직렬화 (순환 참조 없이 getItem 사용) */
export function buildStoreBackupJson(): string {
  const settings = getItem<AcademySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const industryType = normalizeIndustryType(getIndustryType());
  const payload: StoreBackupPayload = {
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    industryType,
    organizationName: settings.name || getIndustryLabel(industryType),
    students: getItem(STORAGE_KEYS.STUDENTS, []),
    parents: getItem(STORAGE_KEYS.PARENTS, []),
    teachers: getItem(STORAGE_KEYS.TEACHERS, []),
    classes: getItem(STORAGE_KEYS.CLASSES, []),
    attendance: getItem(STORAGE_KEYS.ATTENDANCE, []),
    attendanceSessions: getItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, []),
    customerPins: getItem(STORAGE_KEYS.CUSTOMER_PINS, []),
    parentStudentLinks: getItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, []),
    invoices: getItem(STORAGE_KEYS.INVOICES, []),
    expenses: getItem(STORAGE_KEYS.EXPENSES, []),
    incomeEntries: getItem(STORAGE_KEYS.INCOME_ENTRIES, []),
    consultations: getItem(STORAGE_KEYS.CONSULTATIONS, []),
    practiceRecords: getItem(STORAGE_KEYS.PRACTICE_RECORDS, []),
    lessonRecords: getItem(STORAGE_KEYS.LESSON_RECORDS, []),
    textbooks: getItem(STORAGE_KEYS.TEXTBOOKS, []),
    textbookSales: getItem(STORAGE_KEYS.TEXTBOOK_SALES, []),
    textbookPayments: getItem(STORAGE_KEYS.TEXTBOOK_PAYMENTS, []),
    textbookInventoryTransactions: getItem(STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS, []),
    songs: getItem(STORAGE_KEYS.SONGS, []),
    events: getItem(STORAGE_KEYS.EVENTS, []),
    performanceVideos: getItem(STORAGE_KEYS.PERFORMANCE_VIDEOS, []),
    notifications: getItem(STORAGE_KEYS.NOTIFICATIONS, []),
    settings,
    schedules: getItem(STORAGE_KEYS.SCHEDULES, []),
    serviceOfferings: getItem(STORAGE_KEYS.SERVICE_OFFERINGS, []),
    carePrograms: getItem(STORAGE_KEYS.CARE_PROGRAMS, []),
    careEnrollments: getItem(STORAGE_KEYS.CARE_ENROLLMENTS, []),
    products: getItem(STORAGE_KEYS.PRODUCTS, []),
    productSales: getItem(STORAGE_KEYS.PRODUCT_SALES, []),
    curriculumLevels: getItem(STORAGE_KEYS.CURRICULUM_LEVELS, []),
    curriculumItems: getItem(STORAGE_KEYS.CURRICULUM_ITEMS, []),
    curriculumProgress: getItem(STORAGE_KEYS.CURRICULUM_PROGRESS, []),
    weeklyAssignments: getItem(STORAGE_KEYS.WEEKLY_ASSIGNMENTS, []),
    achievements: getItem(STORAGE_KEYS.ACHIEVEMENTS, []),
    learningReports: getItem(STORAGE_KEYS.LEARNING_REPORTS, []),
    academyHomeworkAssignments: getItem(STORAGE_KEYS.ACADEMY_HOMEWORK_ASSIGNMENTS, []),
    academyHomeworkChecks: getItem(STORAGE_KEYS.ACADEMY_HOMEWORK_CHECKS, []),
    academyExams: getItem(STORAGE_KEYS.ACADEMY_EXAMS, []),
    academyExamScores: getItem(STORAGE_KEYS.ACADEMY_EXAM_SCORES, []),
  };
  return JSON.stringify(payload, null, 2);
}

function applyIfPresent(key: (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS], value: unknown) {
  if (value !== undefined && value !== null) {
    setItem(key, value);
  }
}

/** 백업 JSON을 로컬 스토리지에 복원 */
export function restoreStoreBackupJson(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr) as StoreBackupPayload;
    if (!data || typeof data !== 'object') return false;

    const hasKnownField =
      data.version != null ||
      data.exportedAt != null ||
      data.settings != null ||
      Array.isArray(data.students) ||
      Array.isArray(data.parents);

    if (!hasKnownField) return false;

    applyIfPresent(STORAGE_KEYS.STUDENTS, data.students);
    applyIfPresent(STORAGE_KEYS.PARENTS, data.parents);
    applyIfPresent(STORAGE_KEYS.TEACHERS, data.teachers);
    applyIfPresent(STORAGE_KEYS.CLASSES, data.classes);
    applyIfPresent(STORAGE_KEYS.ATTENDANCE, data.attendance);
    applyIfPresent(STORAGE_KEYS.ATTENDANCE_SESSIONS, data.attendanceSessions);
    applyIfPresent(STORAGE_KEYS.CUSTOMER_PINS, data.customerPins);
    applyIfPresent(STORAGE_KEYS.PARENT_STUDENT_LINKS, data.parentStudentLinks);
    applyIfPresent(STORAGE_KEYS.INVOICES, data.invoices);
    applyIfPresent(STORAGE_KEYS.EXPENSES, data.expenses);
    applyIfPresent(STORAGE_KEYS.INCOME_ENTRIES, data.incomeEntries);
    applyIfPresent(STORAGE_KEYS.CONSULTATIONS, data.consultations);
    applyIfPresent(STORAGE_KEYS.PRACTICE_RECORDS, data.practiceRecords);
    applyIfPresent(STORAGE_KEYS.LESSON_RECORDS, data.lessonRecords);
    applyIfPresent(STORAGE_KEYS.TEXTBOOKS, data.textbooks);
    applyIfPresent(STORAGE_KEYS.TEXTBOOK_SALES, data.textbookSales);
    applyIfPresent(STORAGE_KEYS.TEXTBOOK_PAYMENTS, data.textbookPayments);
    applyIfPresent(
      STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS,
      data.textbookInventoryTransactions
    );
    applyIfPresent(STORAGE_KEYS.SONGS, data.songs);
    applyIfPresent(STORAGE_KEYS.EVENTS, data.events);
    applyIfPresent(STORAGE_KEYS.PERFORMANCE_VIDEOS, data.performanceVideos);
    applyIfPresent(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
    applyIfPresent(STORAGE_KEYS.SETTINGS, data.settings);
    applyIfPresent(STORAGE_KEYS.SCHEDULES, data.schedules);
    applyIfPresent(STORAGE_KEYS.SERVICE_OFFERINGS, data.serviceOfferings);
    applyIfPresent(STORAGE_KEYS.CARE_PROGRAMS, data.carePrograms);
    applyIfPresent(STORAGE_KEYS.CARE_ENROLLMENTS, data.careEnrollments);
    applyIfPresent(STORAGE_KEYS.PRODUCTS, data.products);
    applyIfPresent(STORAGE_KEYS.PRODUCT_SALES, data.productSales);
    applyIfPresent(STORAGE_KEYS.CURRICULUM_LEVELS, data.curriculumLevels);
    applyIfPresent(STORAGE_KEYS.CURRICULUM_ITEMS, data.curriculumItems);
    applyIfPresent(STORAGE_KEYS.CURRICULUM_PROGRESS, data.curriculumProgress);
    applyIfPresent(STORAGE_KEYS.WEEKLY_ASSIGNMENTS, data.weeklyAssignments);
    applyIfPresent(STORAGE_KEYS.ACHIEVEMENTS, data.achievements);
    applyIfPresent(STORAGE_KEYS.LEARNING_REPORTS, data.learningReports);
    applyIfPresent(STORAGE_KEYS.ACADEMY_HOMEWORK_ASSIGNMENTS, data.academyHomeworkAssignments);
    applyIfPresent(STORAGE_KEYS.ACADEMY_HOMEWORK_CHECKS, data.academyHomeworkChecks);
    applyIfPresent(STORAGE_KEYS.ACADEMY_EXAMS, data.academyExams);
    applyIfPresent(STORAGE_KEYS.ACADEMY_EXAM_SCORES, data.academyExamScores);

    return true;
  } catch (e) {
    console.error('Store backup restore failed:', e);
    return false;
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'store';
}

export function getStoreBackupFileName(): string {
  const settings = getItem<AcademySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const industry = normalizeIndustryType(getIndustryType());
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const org = sanitizeFileName(settings.name || getIndustryLabel(industry));
  return `moa_${org}_backup_${stamp}.json`;
}

/** 브라우저에서 백업 파일 다운로드 (컴퓨터에 저장) */
export function downloadStoreBackupFile(): { fileName: string; exportedAt: string } {
  const json = buildStoreBackupJson();
  const fileName = getStoreBackupFileName();
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const exportedAt = new Date().toISOString();
  try {
    localStorage.setItem(LAST_BACKUP_KEY, exportedAt);
  } catch {
    /* ignore quota */
  }
  return { fileName, exportedAt };
}

export function getLastStoreBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY);
  } catch {
    return null;
  }
}

/** 마지막 백업 후 경과 일수 (없으면 null) */
export function getDaysSinceLastBackup(): number | null {
  const last = getLastStoreBackupAt();
  if (!last) return null;
  const diff = Date.now() - new Date(last).getTime();
  if (Number.isNaN(diff)) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function shouldRemindBackup(maxDays = 7): boolean {
  const days = getDaysSinceLastBackup();
  if (days === null) return true;
  return days >= maxDays;
}
