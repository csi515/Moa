import type {
  AppNotification,
  ClassItem,
  Consultation,
} from '../../../types';
import { readLocal, writeLocal } from '../localStorageEngine';
import { STORAGE_KEYS } from '../storageKeys';
import {
  classToServiceRow,
  consultationToRow,
  isPracticeRoomScheduleRow,
  notificationToRow,
  bookingToScheduleRow,
  serviceOfferingToRow,
} from './entityMappers';
import type { Booking, ServiceOffering } from '../../../core/types/schedule';
import { sessionToCoreRow } from './attendanceEntityMappers';
import type { AttendanceSession } from '../../../core/attendance/types';
import type { PersistAbortGuard, SyncCache } from './syncTypes';
import { requireCacheList } from './persistHelpers';
import type { CoreClient } from './corePersistSyncTable';
import { syncTable } from './corePersistSyncTable';

export async function persistServices(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  mode: 'piano' | 'pilates',
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  if (mode === 'piano') {
    const classes = requireCacheList<ClassItem>(cache, STORAGE_KEYS.CLASSES, 'services');
    if (!classes) return;

    await syncTable(
      client,
      'services',
      orgId,
      classes.map((c) => c.id),
      async () => {
        for (const cls of classes) {
          if (isAborted()) return;
          const row = classToServiceRow(cls, orgId);
          const { error } = await client.from('services').upsert(row);
          if (error) console.error('Failed to upsert service:', error);

          if (cls.teacherId) {
            await client.from('service_staff').upsert({
              service_id: cls.id,
              staff_id: cls.teacherId,
            });
          }
        }
      },
      { cachePresent: true, context: 'services(classes)', isAborted }
    );
    if (isAborted()) return;
    writeLocal(STORAGE_KEYS.CLASSES, classes);
    return;
  }

  const offerings = requireCacheList<ServiceOffering>(
    cache,
    STORAGE_KEYS.SERVICE_OFFERINGS,
    'services'
  );
  if (!offerings) return;

  await syncTable(
    client,
    'services',
    orgId,
    offerings.map((o) => o.id),
    async () => {
      for (const offering of offerings) {
        if (isAborted()) return;
        const { error } = await client.from('services').upsert(serviceOfferingToRow(offering, orgId));
        if (error) console.error('Failed to upsert service offering:', error);
      }
    },
    { cachePresent: true, context: 'services(offerings)', isAborted }
  );
  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.SERVICE_OFFERINGS, offerings);
}

export async function persistSchedules(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const bookings = requireCacheList<Booking>(cache, STORAGE_KEYS.SCHEDULES, 'schedules');
  if (!bookings) return;

  // 연습실 레거시 schedules 쓰기 중단 (canonical: room_reservations)
  const bookingRows = bookings.map((b) => bookingToScheduleRow(b, orgId));

  // syncTable 삭제 보호: 마이그레이션 전 practice_room 행이 지워지지 않도록 유지
  const { data: existingSchedules } = await client
    .from('schedules')
    .select('id, metadata')
    .eq('organization_id', orgId);
  if (isAborted()) return;
  const protectedPracticeIds = (existingSchedules || [])
    .filter((row) => isPracticeRoomScheduleRow(row.metadata))
    .map((row) => row.id);

  await syncTable(
    client,
    'schedules',
    orgId,
    [...bookingRows.map((r) => r.id), ...protectedPracticeIds],
    async () => {
      for (const row of bookingRows) {
        if (isAborted()) return;
        const { error } = await client.from('schedules').upsert(row);
        if (error) console.error('Failed to upsert schedule:', error);
      }
    },
    { cachePresent: true, context: 'schedules', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.SCHEDULES, bookings);
  // 로컬 캐시는 유지하되 클라우드로 재푸시하지 않음
  writeLocal(
    STORAGE_KEYS.PRACTICE_ROOM_BOOKINGS,
    cache.get(STORAGE_KEYS.PRACTICE_ROOM_BOOKINGS) ||
      readLocal(STORAGE_KEYS.PRACTICE_ROOM_BOOKINGS, [])
  );
}

export async function persistConsultations(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const consultations = requireCacheList<Consultation>(
    cache,
    STORAGE_KEYS.CONSULTATIONS,
    'consultations'
  );
  if (!consultations) return;

  await syncTable(
    client,
    'consultations',
    orgId,
    consultations.map((c) => c.id),
    async () => {
      for (const cst of consultations) {
        if (isAborted()) return;
        const { error } = await client.from('consultations').upsert(consultationToRow(cst, orgId));
        if (error) console.error('Failed to upsert consultation:', error);
      }
    },
    { cachePresent: true, context: 'consultations', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.CONSULTATIONS, consultations);
}

export async function persistNotifications(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<boolean> {
  if (isAborted()) return false;
  const notifications = requireCacheList<AppNotification>(
    cache,
    STORAGE_KEYS.NOTIFICATIONS,
    'notifications'
  );
  if (!notifications) return false;

  let upsertOk = true;

  const syncOk = await syncTable(
    client,
    'notifications',
    orgId,
    notifications.map((n) => n.id),
    async () => {
      for (const notif of notifications) {
        if (isAborted()) return;
        const { error } = await client.from('notifications').upsert(notificationToRow(notif, orgId));
        if (error) {
          upsertOk = false;
          console.error('Failed to upsert notification:', error);
        }
      }
    },
    { cachePresent: true, context: 'notifications', isAborted }
  );

  if (isAborted()) return false;
  writeLocal(STORAGE_KEYS.NOTIFICATIONS, notifications);
  return upsertOk && syncOk;
}

export async function persistAttendanceSessions(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const sessions = requireCacheList<AttendanceSession>(
    cache,
    STORAGE_KEYS.ATTENDANCE_SESSIONS,
    'attendance_sessions'
  );
  if (!sessions) return;

  await syncTable(
    client,
    'attendance_sessions',
    orgId,
    sessions.map((s) => s.id),
    async () => {
      for (const session of sessions) {
        if (isAborted()) return;
        const { error } = await client
          .from('attendance_sessions')
          .upsert(sessionToCoreRow(session, orgId));
        if (error) console.error('Failed to upsert attendance session:', error);
      }
    },
    { cachePresent: true, context: 'attendance_sessions', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.ATTENDANCE_SESSIONS, sessions);
}
