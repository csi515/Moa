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
  TUITION_PAYMENTS: 'piano_app_tuition_payments',
  EXPENSES: 'core_expenses',
  /** 강사 정산 확정 기록 (local only — 지출 등록 전 상태) */
  TEACHER_PAYROLL_SETTLEMENTS: 'core_teacher_payroll_settlements',
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
  SCHEDULES: 'core_schedules',
  SERVICE_OFFERINGS: 'core_service_offerings',
  SESSION_PASSES: 'core_session_passes',
  SLOT_RECRUITMENTS: 'core_slot_recruitments',
  /** 체육관 등 — 차량 운행 신청 */
  SHUTTLE_RIDE_REQUESTS: 'core_shuttle_ride_requests',
  /** @deprecated 레거시 로컬 연습실 예약 — SoT는 room_reservations. sync 시 비움, 읽기 폴백만 */
  PRACTICE_ROOM_BOOKINGS: 'core_practice_room_bookings',
  /** 어린이집 플러그인 — 알림장 */
  CARE_JOURNALS: 'daycare_care_journals',
  /** 어린이집 플러그인 — 투약 의뢰 */
  MEDICATION_REQUESTS: 'daycare_medication_requests',
  /** 어린이집 — 원아 건강·귀가 기록 (local only, 테이블 없음) */
  CARE_CHILD_RECORDS: 'daycare_care_child_records',
  /** 어린이집 — 사고 기록 (local only, 테이블 없음) */
  CARE_INCIDENTS: 'daycare_care_incidents',
  /** 어린이집 — 보건증 만료 (local only) */
  CARE_STAFF_HEALTH_CERTS: 'daycare_care_staff_health_certs',
  /** 어린이집 — 안전점검·대피훈련 (local only) */
  CARE_SAFETY_LOGS: 'daycare_care_safety_logs',
  /** 어린이집 — 보존식 (local only) */
  CARE_MEAL_SAMPLES: 'daycare_care_meal_samples',
  /** 어린이집 — CCTV 열람 신청 (local only) */
  CARE_CCTV_REQUESTS: 'daycare_care_cctv_requests',
  /** 어린이집 — 하원 인수 (local only) */
  CARE_PICKUP_LOGS: 'daycare_care_pickup_logs',
  ACTIVE_USER: 'piano_app_active_user',
  INITIALIZED: 'piano_app_initialized_v3',
  /** 온보딩 진행 상태 (org 스코프) — completed/skipped는 INITIALIZED와 함께 기록 */
  ONBOARDING_PROGRESS: 'piano_app_onboarding_progress_v1',
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
  STORAGE_KEYS.TUITION_PAYMENTS,
  STORAGE_KEYS.CONSULTATIONS,
  STORAGE_KEYS.NOTIFICATIONS,
  STORAGE_KEYS.SCHEDULES,
  STORAGE_KEYS.SERVICE_OFFERINGS,
  STORAGE_KEYS.EXPENSES,
  STORAGE_KEYS.INCOME_ENTRIES,
  STORAGE_KEYS.ATTENDANCE_SESSIONS,
  STORAGE_KEYS.CUSTOMER_PINS,
  STORAGE_KEYS.PRACTICE_ROOM_BOOKINGS,
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

/** 어린이집 플러그인 Supabase 동기화 */
export const DAYCARE_SYNC_KEYS: ReadonlySet<StorageKey> = new Set([
  STORAGE_KEYS.CARE_JOURNALS,
  STORAGE_KEYS.MEDICATION_REQUESTS,
]);

/** 클라이언트 전용 localStorage 키 (Supabase sync 제외)
 * SESSION_PASSES: 회차권은 아직 원격 스키마 없음 — 재무/다기기 미반영(제품 결정).
 * SLOT_RECRUITMENTS: 키 자체는 LOCAL_ONLY이나 settings.slotRecruitments로 이중 저장·동기화.
 */
export const LOCAL_ONLY_KEYS: ReadonlySet<StorageKey> = new Set([
  STORAGE_KEYS.ACTIVE_USER,
  STORAGE_KEYS.INITIALIZED,
  STORAGE_KEYS.ONBOARDING_PROGRESS,
  STORAGE_KEYS.SESSION_PASSES, // LOCAL_ONLY — sync 금지
  STORAGE_KEYS.SLOT_RECRUITMENTS, // settings.slotRecruitments 미러
  STORAGE_KEYS.SHUTTLE_RIDE_REQUESTS,
  STORAGE_KEYS.CARE_CHILD_RECORDS,
  STORAGE_KEYS.CARE_INCIDENTS,
  STORAGE_KEYS.CARE_STAFF_HEALTH_CERTS,
  STORAGE_KEYS.CARE_SAFETY_LOGS,
  STORAGE_KEYS.CARE_MEAL_SAMPLES,
  STORAGE_KEYS.CARE_CCTV_REQUESTS,
  STORAGE_KEYS.CARE_PICKUP_LOGS,
  STORAGE_KEYS.TEACHER_PAYROLL_SETTLEMENTS,
]);

/** 전체 Supabase sync 키 (Core + Piano + Daycare) */
export const SUPABASE_SYNC_KEYS: ReadonlySet<StorageKey> = new Set([
  ...CORE_SYNC_KEYS,
  ...PIANO_SYNC_KEYS,
  ...DAYCARE_SYNC_KEYS,
]);
