import { getCoreClient } from '../../../lib/supabase';
import { STORAGE_KEYS, type StorageKey } from '../storageKeys';
import type { PersistAbortGuard, SyncCache } from './syncTypes';
import {
  persistCustomerPins,
  persistCustomers,
  persistParentStudentLinks,
  persistSettings,
  persistStaff,
} from './corePersistPeople';
import {
  persistAttendanceSessions,
  persistConsultations,
  persistNotifications,
  persistSchedules,
  persistServices,
} from './corePersistCatalog';
import {
  persistExpenses,
  persistIncomeEntries,
  persistPayments,
  persistTeacherPayrollSettlements,
  persistTuitionPayments,
} from './corePersistFinance';

/** Core 엔티티 persist — false면 호출측이 soft-fail로 처리 */
export async function persistCoreEntity(
  key: StorageKey,
  organizationId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard = () => false
): Promise<boolean> {
  if (isAborted()) return false;
  const client = getCoreClient();

  switch (key) {
    case STORAGE_KEYS.SETTINGS:
      await persistSettings(client, organizationId, cache);
      break;
    case STORAGE_KEYS.TEACHERS:
      await persistStaff(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.STUDENTS:
    case STORAGE_KEYS.PARENTS:
      await persistCustomers(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.CLASSES:
      await persistServices(client, organizationId, cache, 'piano', isAborted);
      break;
    case STORAGE_KEYS.SERVICE_OFFERINGS:
      await persistServices(client, organizationId, cache, 'pilates', isAborted);
      break;
    case STORAGE_KEYS.SCHEDULES:
    case STORAGE_KEYS.PRACTICE_ROOM_BOOKINGS:
      await persistSchedules(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.INVOICES:
      await persistPayments(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.TUITION_PAYMENTS:
      await persistTuitionPayments(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.EXPENSES:
      await persistExpenses(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.INCOME_ENTRIES:
      await persistIncomeEntries(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.TEACHER_PAYROLL_SETTLEMENTS:
      return persistTeacherPayrollSettlements(client, organizationId, cache, isAborted);
    case STORAGE_KEYS.CONSULTATIONS:
      await persistConsultations(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.NOTIFICATIONS:
      return persistNotifications(client, organizationId, cache, isAborted);
    case STORAGE_KEYS.ATTENDANCE_SESSIONS:
      await persistAttendanceSessions(client, organizationId, cache, isAborted);
      break;
    case STORAGE_KEYS.CUSTOMER_PINS:
      await persistCustomerPins(client, organizationId, cache);
      break;
    case STORAGE_KEYS.PARENT_STUDENT_LINKS:
      await persistParentStudentLinks(client, organizationId, cache, isAborted);
      break;
    default:
      return true;
  }
  return !isAborted();
}
