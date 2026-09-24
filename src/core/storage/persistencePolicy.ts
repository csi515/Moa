/**
 * 데이터별 Source of Truth 정책.
 * 새 storage key는 정책을 선언한다. 기존 키 동작은 한꺼번에 바꾸지 않는다.
 */

export const PERSISTENCE_POLICIES = [
  'server-authoritative',
  'server-with-local-cache',
  'offline-command',
  'local-only',
] as const;

export type PersistencePolicy = (typeof PERSISTENCE_POLICIES)[number];

export type PersistencePolicyRule = {
  policy: PersistencePolicy;
  /** 원본 위치. cache는 원본이 아니다. */
  sourceOfTruth: 'server' | 'local' | 'command-queue';
  /** localStorage write 성공을 업무 성공으로 볼 수 있는지 */
  localWriteConfirms: boolean;
};

export const PERSISTENCE_POLICY_RULES: Record<PersistencePolicy, PersistencePolicyRule> = {
  'server-authoritative': {
    policy: 'server-authoritative',
    sourceOfTruth: 'server',
    localWriteConfirms: false,
  },
  'server-with-local-cache': {
    policy: 'server-with-local-cache',
    sourceOfTruth: 'server',
    localWriteConfirms: false,
  },
  'offline-command': {
    policy: 'offline-command',
    sourceOfTruth: 'command-queue',
    localWriteConfirms: false,
  },
  'local-only': {
    policy: 'local-only',
    sourceOfTruth: 'local',
    localWriteConfirms: true,
  },
};

/**
 * 대표 핵심 키만 명시. 나머지는 기존 SYNC/LOCAL_ONLY 분류를 따른다.
 * 값은 src/services/adapters/storageKeys.ts STORAGE_KEYS 와 동일해야 한다.
 */
export const DECLARED_STORAGE_KEY_POLICIES = {
  piano_app_tuition_payments: 'server-authoritative',
  piano_app_invoices: 'server-authoritative',
  core_session_passes: 'server-authoritative',
  core_schedules: 'server-authoritative',
  piano_app_textbook_sales: 'server-authoritative',
  piano_app_textbook_payments: 'server-authoritative',
  piano_app_students: 'server-with-local-cache',
  piano_app_teachers: 'server-with-local-cache',
  piano_app_settings: 'server-with-local-cache',
  piano_app_attendance: 'server-with-local-cache',
  daycare_care_child_records: 'server-with-local-cache',
  daycare_care_incidents: 'server-with-local-cache',
  piano_app_active_user: 'local-only',
  piano_app_initialized_v3: 'local-only',
  piano_app_onboarding_progress_v1: 'local-only',
  core_shuttle_ride_requests: 'local-only',
} as const satisfies Record<string, PersistencePolicy>;

/** pendingMutations / syncOutbox 는 데이터가 아니라 offline command 큐. */
export const OFFLINE_COMMAND_STORE_POLICIES = {
  pendingMutations: 'offline-command',
  syncOutbox: 'offline-command',
} as const satisfies Record<string, PersistencePolicy>;

export function persistencePolicyFor(
  key: string,
  fallback?: PersistencePolicy
): PersistencePolicy {
  const declared = DECLARED_STORAGE_KEY_POLICIES[key as keyof typeof DECLARED_STORAGE_KEY_POLICIES];
  if (declared) return declared;
  return fallback ?? 'server-with-local-cache';
}

export function persistenceRuleFor(key: string, fallback?: PersistencePolicy): PersistencePolicyRule {
  return PERSISTENCE_POLICY_RULES[persistencePolicyFor(key, fallback)];
}

/** server 원본 데이터는 local write만으로 성공 확정하지 않는다. */
export function localWriteConfirmsPersist(key: string, fallback?: PersistencePolicy): boolean {
  return persistenceRuleFor(key, fallback).localWriteConfirms;
}

export function isServerSourcedPolicy(policy: PersistencePolicy): boolean {
  return (
    policy === 'server-authoritative' ||
    policy === 'server-with-local-cache' ||
    policy === 'offline-command'
  );
}
