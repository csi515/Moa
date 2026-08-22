/** localStorage 키 상수 (Core + Piano 모듈) */
export const STORAGE_KEYS = {
  STUDENTS: 'piano_app_students',
  PARENTS: 'piano_app_parents',
  TEACHERS: 'piano_app_teachers',
  CLASSES: 'piano_app_classes',
  ATTENDANCE: 'piano_app_attendance',
  INVOICES: 'piano_app_invoices',
  EXPENSES: 'piano_app_expenses',
  CONSULTATIONS: 'piano_app_consultations',
  PRACTICE_RECORDS: 'piano_app_practice_records',
  LESSON_RECORDS: 'piano_app_lesson_records',
  TEXTBOOKS: 'piano_app_textbooks',
  TEXTBOOK_SALES: 'piano_app_textbook_sales',
  TEXTBOOK_PAYMENTS: 'piano_app_textbook_payments',
  TEXTBOOK_INVENTORY_TRANSACTIONS: 'piano_app_textbook_inventory_transactions',
  SONGS: 'piano_app_songs',
  NOTIFICATIONS: 'piano_app_notifications',
  SETTINGS: 'piano_app_settings',
  ACTIVE_USER: 'piano_app_active_user',
  INITIALIZED: 'piano_app_initialized_v3',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Supabase에서 직접 동기화하는 엔티티 키 (Phase 2 PoC) */
export const SUPABASE_SYNC_KEYS: ReadonlySet<StorageKey> = new Set([
  STORAGE_KEYS.TEACHERS,
  STORAGE_KEYS.SETTINGS,
]);
