/** localStorage 키 상수 (Core + Piano 모듈) */
export const STORAGE_KEYS = {
  STUDENTS: 'piano_app_students',
  PARENTS: 'piano_app_parents',
  PARENT_STUDENT_LINKS: 'core_parent_student_links',
  TEACHERS: 'piano_app_teachers',
  CLASSES: 'piano_app_classes',
  ATTENDANCE: 'piano_app_attendance',
  ATTENDANCE_SESSIONS: 'core_attendance_sessions',
  CUSTOMER_PINS: 'core_customer_pins',
  INVOICES: 'piano_app_invoices',
  EXPENSES: 'core_expenses',
  INCOME_ENTRIES: 'core_income_entries',
  CONSULTATIONS: 'piano_app_consultations',
  PRACTICE_RECORDS: 'piano_app_practice_records',
  LESSON_RECORDS: 'piano_app_lesson_records',
  TEXTBOOKS: 'piano_app_textbooks',
  TEXTBOOK_SALES: 'piano_app_textbook_sales',
  TEXTBOOK_PAYMENTS: 'piano_app_textbook_payments',
  TEXTBOOK_INVENTORY_TRANSACTIONS: 'piano_app_textbook_inventory_transactions',
  SONGS: 'piano_app_songs',
  EVENTS: 'piano_app_events',
  PERFORMANCE_VIDEOS: 'piano_app_performance_videos',
  CURRICULUM_LEVELS: 'piano_curriculum_levels',
  CURRICULUM_ITEMS: 'piano_curriculum_items',
  CURRICULUM_PROGRESS: 'piano_curriculum_progress',
  WEEKLY_ASSIGNMENTS: 'piano_weekly_assignments',
  ACHIEVEMENTS: 'piano_achievements',
  LEARNING_REPORTS: 'piano_learning_reports',
  NOTIFICATIONS: 'piano_app_notifications',
  SETTINGS: 'piano_app_settings',
  CONSULTATION_BOOKING_SETTINGS: 'core_consultation_booking_settings',
  CONSULTATION_BOOKING_REQUESTS: 'core_consultation_booking_requests',
  SCHEDULES: 'core_schedules',
  SERVICE_OFFERINGS: 'core_service_offerings',
  ACTIVE_USER: 'piano_app_active_user',
  INITIALIZED: 'piano_app_initialized_v3',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Core 스키마 동기화 (Phase 3) */
export const CORE_SYNC_KEYS: ReadonlySet<StorageKey> = new Set([
  STORAGE_KEYS.SETTINGS,
  STORAGE_KEYS.TEACHERS,
  STORAGE_KEYS.STUDENTS,
  STORAGE_KEYS.PARENTS,
  STORAGE_KEYS.PARENT_STUDENT_LINKS,
  STORAGE_KEYS.CLASSES,
  STORAGE_KEYS.INVOICES,
  STORAGE_KEYS.CONSULTATIONS,
  STORAGE_KEYS.NOTIFICATIONS,
  STORAGE_KEYS.SCHEDULES,
  STORAGE_KEYS.SERVICE_OFFERINGS,
  STORAGE_KEYS.EXPENSES,
  STORAGE_KEYS.INCOME_ENTRIES,
  STORAGE_KEYS.ATTENDANCE_SESSIONS,
  STORAGE_KEYS.CUSTOMER_PINS,
  STORAGE_KEYS.CONSULTATION_BOOKING_SETTINGS,
  STORAGE_KEYS.CONSULTATION_BOOKING_REQUESTS,
]);

/** Piano 모듈 Supabase 동기화 (Phase 4 + Phase 6 expenses) */
export const PIANO_SYNC_KEYS: ReadonlySet<StorageKey> = new Set([
  STORAGE_KEYS.STUDENTS,
  STORAGE_KEYS.ATTENDANCE,
  STORAGE_KEYS.PRACTICE_RECORDS,
  STORAGE_KEYS.LESSON_RECORDS,
  STORAGE_KEYS.TEXTBOOKS,
  STORAGE_KEYS.TEXTBOOK_SALES,
  STORAGE_KEYS.TEXTBOOK_PAYMENTS,
  STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS,
  STORAGE_KEYS.SONGS,
  STORAGE_KEYS.EVENTS,
  STORAGE_KEYS.PERFORMANCE_VIDEOS,
  STORAGE_KEYS.CURRICULUM_LEVELS,
  STORAGE_KEYS.CURRICULUM_ITEMS,
  STORAGE_KEYS.CURRICULUM_PROGRESS,
  STORAGE_KEYS.WEEKLY_ASSIGNMENTS,
  STORAGE_KEYS.ACHIEVEMENTS,
  STORAGE_KEYS.LEARNING_REPORTS,
]);

/** 클라이언트 전용 localStorage 키 (Supabase sync 제외) */
export const LOCAL_ONLY_KEYS: ReadonlySet<StorageKey> = new Set([
  STORAGE_KEYS.ACTIVE_USER,
  STORAGE_KEYS.INITIALIZED,
]);

/** 전체 Supabase sync 키 (Core + Piano) */
export const SUPABASE_SYNC_KEYS: ReadonlySet<StorageKey> = new Set([
  ...CORE_SYNC_KEYS,
  ...PIANO_SYNC_KEYS,
]);
