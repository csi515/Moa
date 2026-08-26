import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AcademySettings,
  AppNotification,
  ClassItem,
  Consultation,
  Parent,
  Student,
  Teacher,
  TuitionInvoice,
} from '../../../types';
import type { Database } from '../../../lib/supabase/database.types';
import { getCoreClient } from '../../../lib/supabase';
import { readLocal, writeLocal } from '../localStorageEngine';
import { STORAGE_KEYS, type StorageKey } from '../storageKeys';
import {
  classToServiceRow,
  consultationRowToApp,
  consultationToRow,
  customerRowToParent,
  customerRowToStudent,
  invoiceToPaymentRow,
  isParentCustomer,
  isPilatesServiceRow,
  isStudentCustomer,
  notificationRowToApp,
  notificationToRow,
  parentToCustomerRow,
  parseOrganizationSettings,
  paymentRowToInvoice,
  bookingToScheduleRow,
  scheduleRowToBooking,
  serviceOfferingToRow,
  serviceRowToClass,
  serviceRowToOffering,
  staffRowToTeacher,
  studentContactRow,
  studentToCustomerRow,
  teacherToStaffRow,
} from './entityMappers';
import type { Booking, ServiceOffering } from '../../../core/types/schedule';
import { normalizeIndustryType } from '../../../core/industry/types';
import {
  expenseToCoreRow,
  coreRowToExpense,
  incomeToCoreRow,
  coreRowToIncome,
} from './financeEntityMappers';
import type { FinanceExpense, IncomeEntry } from '../../../core/finance/types';
import {
  coreRowToSession,
  pinRowsFromCustomers,
  sessionToCoreRow,
} from './attendanceEntityMappers';
import type { AttendanceSession } from '../../../core/attendance/types';
import type { ParentStudentLink } from '../../../core/parent/types';
import { linkToRow, rowToLink } from './parentLinkEntityMappers';
import { diffIds } from './utils';

type CoreClient = SupabaseClient<Database, 'core'>;

export interface SyncCache {
  get<T>(key: StorageKey): T | undefined;
  set<T>(key: StorageKey, value: T): void;
  delete(key: StorageKey): void;
}

/** Core 엔티티 전체 hydrate */
export async function hydrateCoreEntities(
  organizationId: string,
  cache: SyncCache,
  industryTypeRaw?: string | null
): Promise<void> {
  const industryType = normalizeIndustryType(industryTypeRaw);
  const client = getCoreClient();

  const [
    orgResult,
    staffResult,
    customersResult,
    contactsResult,
    servicesResult,
    schedulesResult,
    paymentsResult,
    expensesResult,
    incomeResult,
    consultationsResult,
    notificationsResult,
    attendanceSessionsResult,
    parentLinksResult,
  ] = await Promise.all([
    client.from('organizations').select('settings, name, industry_type').eq('id', organizationId).single(),
    client.from('staff').select('*').eq('organization_id', organizationId),
    client.from('customers').select('*').eq('organization_id', organizationId),
    client.from('customer_contacts').select('*').eq('organization_id', organizationId),
    client.from('services').select('*').eq('organization_id', organizationId),
    client.from('schedules').select('*').eq('organization_id', organizationId),
    client.from('payments').select('*').eq('organization_id', organizationId),
    client.from('expenses').select('*').eq('organization_id', organizationId),
    client.from('income_entries').select('*').eq('organization_id', organizationId),
    client.from('consultations').select('*').eq('organization_id', organizationId),
    client.from('notifications').select('*').eq('organization_id', organizationId),
    client.from('attendance_sessions').select('*').eq('organization_id', organizationId),
    client.from('parent_student_links').select('*').eq('organization_id', organizationId),
  ]);

  logErrors({
    org: orgResult.error,
    staff: staffResult.error,
    customers: customersResult.error,
    contacts: contactsResult.error,
    services: servicesResult.error,
    schedules: schedulesResult.error,
    payments: paymentsResult.error,
    expenses: expensesResult.error,
    income: incomeResult.error,
    consultations: consultationsResult.error,
    notifications: notificationsResult.error,
    attendanceSessions: attendanceSessionsResult.error,
    parentLinks: parentLinksResult.error,
  });

  const defaultSettings = readLocal<AcademySettings>(STORAGE_KEYS.SETTINGS, {
    name: orgResult.data?.name || '',
    address: '',
    phone: '',
    defaultTuitionFee: 180000,
  });
  const settings = parseOrganizationSettings(orgResult.data?.settings, defaultSettings);
  if (!settings.name && orgResult.data?.name) settings.name = orgResult.data.name;

  const teachers = (staffResult.data || []).map(staffRowToTeacher);

  const contactByCustomer = new Map(
    (contactsResult.data || [])
      .filter((c) => c.is_primary)
      .map((c) => [c.customer_id, c.name])
  );

  const customers = customersResult.data || [];
  const students: Student[] = customers
    .filter((c) => isStudentCustomer(c.metadata))
    .map((c) => customerRowToStudent(c, contactByCustomer.get(c.id)));

  const parents: Parent[] = customers
    .filter((c) => isParentCustomer(c.metadata))
    .map(customerRowToParent);

  const serviceRows = servicesResult.data || [];
  const classes =
    industryType === 'pilates'
      ? []
      : serviceRows.filter((r) => !isPilatesServiceRow(r.metadata)).map(serviceRowToClass);
  const serviceOfferings =
    industryType === 'pilates'
      ? serviceRows.map(serviceRowToOffering)
      : [];

  const bookings = (schedulesResult.data || []).map(scheduleRowToBooking);
  const invoices = (paymentsResult.data || []).map(paymentRowToInvoice);

  const studentMap = new Map(students.map((s) => [s.id, s.name]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t.name]));
  const consultations = (consultationsResult.data || []).map((row) =>
    consultationRowToApp(
      row,
      studentMap.get(row.customer_id) || '',
      row.staff_id ? teacherMap.get(row.staff_id) || '' : ''
    )
  );

  const notifications = (notificationsResult.data || []).map(notificationRowToApp);
  const attendanceSessions = (attendanceSessionsResult.data || []).map(coreRowToSession);
  const customerPins = pinRowsFromCustomers(
    (customersResult.data || []).map((c) => ({
      id: c.id,
      check_in_pin_hash: (c as { check_in_pin_hash?: string | null }).check_in_pin_hash ?? null,
    }))
  );
  const parentStudentLinks = (parentLinksResult.data || []).map(rowToLink);

  const entities: [StorageKey, unknown][] = [
    [STORAGE_KEYS.SETTINGS, settings],
    [STORAGE_KEYS.TEACHERS, teachers],
    [STORAGE_KEYS.STUDENTS, students],
    [STORAGE_KEYS.PARENTS, parents],
    [STORAGE_KEYS.CLASSES, classes],
    [STORAGE_KEYS.SERVICE_OFFERINGS, serviceOfferings],
    [STORAGE_KEYS.SCHEDULES, bookings],
    [STORAGE_KEYS.INVOICES, invoices],
    [STORAGE_KEYS.EXPENSES, (expensesResult.data || []).map(coreRowToExpense)],
    [STORAGE_KEYS.INCOME_ENTRIES, (incomeResult.data || []).map(coreRowToIncome)],
    [STORAGE_KEYS.CONSULTATIONS, consultations],
    [STORAGE_KEYS.NOTIFICATIONS, notifications],
    [STORAGE_KEYS.ATTENDANCE_SESSIONS, attendanceSessions],
    [STORAGE_KEYS.CUSTOMER_PINS, customerPins],
    [STORAGE_KEYS.PARENT_STUDENT_LINKS, parentStudentLinks],
  ];

  for (const [key, value] of entities) {
    cache.set(key, value);
    writeLocal(key, value);
  }
}

/** Core 엔티티 persist */
export async function persistCoreEntity(
  key: StorageKey,
  organizationId: string,
  cache: SyncCache
): Promise<void> {
  const client = getCoreClient();

  switch (key) {
    case STORAGE_KEYS.SETTINGS:
      return persistSettings(client, organizationId, cache);
    case STORAGE_KEYS.TEACHERS:
      return persistStaff(client, organizationId, cache);
    case STORAGE_KEYS.STUDENTS:
    case STORAGE_KEYS.PARENTS:
      return persistCustomers(client, organizationId, cache);
    case STORAGE_KEYS.CLASSES:
      return persistServices(client, organizationId, cache, 'piano');
    case STORAGE_KEYS.SERVICE_OFFERINGS:
      return persistServices(client, organizationId, cache, 'pilates');
    case STORAGE_KEYS.SCHEDULES:
      return persistSchedules(client, organizationId, cache);
    case STORAGE_KEYS.INVOICES:
      return persistPayments(client, organizationId, cache);
    case STORAGE_KEYS.EXPENSES:
      return persistExpenses(client, organizationId, cache);
    case STORAGE_KEYS.INCOME_ENTRIES:
      return persistIncomeEntries(client, organizationId, cache);
    case STORAGE_KEYS.CONSULTATIONS:
      return persistConsultations(client, organizationId, cache);
    case STORAGE_KEYS.NOTIFICATIONS:
      return persistNotifications(client, organizationId, cache);
    case STORAGE_KEYS.ATTENDANCE_SESSIONS:
      return persistAttendanceSessions(client, organizationId, cache);
    case STORAGE_KEYS.CUSTOMER_PINS:
      return persistCustomerPins(client, organizationId, cache);
    case STORAGE_KEYS.PARENT_STUDENT_LINKS:
      return persistParentStudentLinks(client, organizationId, cache);
    default:
      return;
  }
}

async function persistSettings(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const settings = cache.get<AcademySettings>(STORAGE_KEYS.SETTINGS);
  if (!settings) return;

  const { error } = await client
    .from('organizations')
    .update({ settings: settings as never })
    .eq('id', orgId);

  if (error) console.error('Failed to persist settings:', error);
  writeLocal(STORAGE_KEYS.SETTINGS, settings);
}

async function persistStaff(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const teachers = cache.get<Teacher[]>(STORAGE_KEYS.TEACHERS) || [];
  await syncTable(client, 'staff', orgId, teachers.map((t) => t.id), async () => {
    for (const teacher of teachers) {
      const { error } = await client.from('staff').upsert(teacherToStaffRow(teacher, orgId));
      if (error) console.error('Failed to upsert staff:', error);
    }
  });
  writeLocal(STORAGE_KEYS.TEACHERS, teachers);
}

async function persistCustomers(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const students = cache.get<Student[]>(STORAGE_KEYS.STUDENTS) || [];
  const parents = cache.get<Parent[]>(STORAGE_KEYS.PARENTS) || [];
  const allIds = [...students.map((s) => s.id), ...parents.map((p) => p.id)];

  await syncTable(client, 'customers', orgId, allIds, async () => {
    const pinMap = new Map(
      (cache.get<{ customerId: string; pinHash: string }[]>(STORAGE_KEYS.CUSTOMER_PINS) || []).map(
        (p) => [p.customerId, p.pinHash]
      )
    );
    const links = cache.get<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS) || [];

    for (const student of students) {
      const row = {
        ...studentToCustomerRow(student, orgId),
        check_in_pin_hash: pinMap.get(student.id) ?? null,
      };
      const { error } = await client.from('customers').upsert(row);
      if (error) console.error('Failed to upsert student:', error);

      const primaryLink =
        links.find((l) => l.studentId === student.id && l.isPrimary) ||
        links.find((l) => l.studentId === student.id);
      const parentRecord = primaryLink
        ? parents.find((p) => p.id === primaryLink.parentId)
        : parents.find((p) => p.id === student.parentId);
      const contact = studentContactRow(
        student,
        orgId,
        undefined,
        parentRecord
          ? { name: parentRecord.name, phone: parentRecord.phone, email: parentRecord.email }
          : undefined
      );
      if (contact) {
        const { data: existing } = await client
          .from('customer_contacts')
          .select('id')
          .eq('customer_id', student.id)
          .eq('is_primary', true)
          .maybeSingle();

        const contactRow = { ...contact, id: existing?.id || contact.id };
        const { error: contactError } = await client.from('customer_contacts').upsert(contactRow);
        if (contactError) console.error('Failed to upsert contact:', contactError);
      }
    }

    for (const parent of parents) {
      const { error } = await client.from('customers').upsert(parentToCustomerRow(parent, orgId));
      if (error) console.error('Failed to upsert parent:', error);
    }
  });

  writeLocal(STORAGE_KEYS.STUDENTS, students);
  writeLocal(STORAGE_KEYS.PARENTS, parents);
}

async function persistServices(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  mode: 'piano' | 'pilates'
): Promise<void> {
  if (mode === 'piano') {
    const classes = cache.get<ClassItem[]>(STORAGE_KEYS.CLASSES) || [];
    await syncTable(client, 'services', orgId, classes.map((c) => c.id), async () => {
      for (const cls of classes) {
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
    });
    writeLocal(STORAGE_KEYS.CLASSES, classes);
    return;
  }

  const offerings = cache.get<ServiceOffering[]>(STORAGE_KEYS.SERVICE_OFFERINGS) || [];
  await syncTable(client, 'services', orgId, offerings.map((o) => o.id), async () => {
    for (const offering of offerings) {
      const { error } = await client.from('services').upsert(serviceOfferingToRow(offering, orgId));
      if (error) console.error('Failed to upsert service offering:', error);
    }
  });
  writeLocal(STORAGE_KEYS.SERVICE_OFFERINGS, offerings);
}

async function persistSchedules(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const bookings = cache.get<Booking[]>(STORAGE_KEYS.SCHEDULES) || [];

  await syncTable(client, 'schedules', orgId, bookings.map((b) => b.id), async () => {
    for (const booking of bookings) {
      const { error } = await client.from('schedules').upsert(bookingToScheduleRow(booking, orgId));
      if (error) console.error('Failed to upsert schedule:', error);
    }
  });

  writeLocal(STORAGE_KEYS.SCHEDULES, bookings);
}

async function persistPayments(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const invoices = cache.get<TuitionInvoice[]>(STORAGE_KEYS.INVOICES) || [];

  await syncTable(client, 'payments', orgId, invoices.map((i) => i.id), async () => {
    for (const inv of invoices) {
      const { error } = await client.from('payments').upsert(invoiceToPaymentRow(inv, orgId));
      if (error) console.error('Failed to upsert payment:', error);
    }
  });

  writeLocal(STORAGE_KEYS.INVOICES, invoices);
}

async function persistExpenses(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const expenses = cache.get<FinanceExpense[]>(STORAGE_KEYS.EXPENSES) || [];

  await syncTable(client, 'expenses', orgId, expenses.map((e) => e.id), async () => {
    for (const expense of expenses) {
      const { error } = await client.from('expenses').upsert(expenseToCoreRow(expense, orgId));
      if (error) console.error('Failed to upsert expense:', error);
    }
  });

  writeLocal(STORAGE_KEYS.EXPENSES, expenses);
}

async function persistIncomeEntries(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const entries = cache.get<IncomeEntry[]>(STORAGE_KEYS.INCOME_ENTRIES) || [];

  await syncTable(client, 'income_entries', orgId, entries.map((e) => e.id), async () => {
    for (const entry of entries) {
      const { error } = await client.from('income_entries').upsert(incomeToCoreRow(entry, orgId));
      if (error) console.error('Failed to upsert income entry:', error);
    }
  });

  writeLocal(STORAGE_KEYS.INCOME_ENTRIES, entries);
}

async function persistConsultations(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const consultations = cache.get<Consultation[]>(STORAGE_KEYS.CONSULTATIONS) || [];

  await syncTable(
    client,
    'consultations',
    orgId,
    consultations.map((c) => c.id),
    async () => {
      for (const cst of consultations) {
        const { error } = await client.from('consultations').upsert(consultationToRow(cst, orgId));
        if (error) console.error('Failed to upsert consultation:', error);
      }
    }
  );

  writeLocal(STORAGE_KEYS.CONSULTATIONS, consultations);
}

async function persistNotifications(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const notifications = cache.get<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];

  await syncTable(
    client,
    'notifications',
    orgId,
    notifications.map((n) => n.id),
    async () => {
      for (const notif of notifications) {
        const { error } = await client.from('notifications').upsert(notificationToRow(notif, orgId));
        if (error) console.error('Failed to upsert notification:', error);
      }
    }
  );

  writeLocal(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

async function persistAttendanceSessions(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const sessions = cache.get<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE_SESSIONS) || [];

  await syncTable(
    client,
    'attendance_sessions',
    orgId,
    sessions.map((s) => s.id),
    async () => {
      for (const session of sessions) {
        const { error } = await client
          .from('attendance_sessions')
          .upsert(sessionToCoreRow(session, orgId));
        if (error) console.error('Failed to upsert attendance session:', error);
      }
    }
  );

  writeLocal(STORAGE_KEYS.ATTENDANCE_SESSIONS, sessions);
}

async function persistCustomerPins(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const pins = cache.get<{ customerId: string; pinHash: string }[]>(STORAGE_KEYS.CUSTOMER_PINS) || [];
  const pinMap = new Map(pins.map((p) => [p.customerId, p.pinHash]));

  for (const [customerId, pinHash] of pinMap) {
    const { error } = await client
      .from('customers')
      .update({ check_in_pin_hash: pinHash })
      .eq('id', customerId)
      .eq('organization_id', orgId);
    if (error) console.error('Failed to update customer PIN:', error);
  }

  writeLocal(STORAGE_KEYS.CUSTOMER_PINS, pins);
}

async function persistParentStudentLinks(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const links = cache.get<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS) || [];

  const { error: deleteError } = await client
    .from('parent_student_links')
    .delete()
    .eq('organization_id', orgId);
  if (deleteError) console.error('Failed to delete parent_student_links:', deleteError);

  if (links.length > 0) {
    const rows = links.map((l) => linkToRow(l, orgId));
    const { error } = await client.from('parent_student_links').insert(rows);
    if (error) console.error('Failed to insert parent_student_links:', error);
  }

  writeLocal(STORAGE_KEYS.PARENT_STUDENT_LINKS, links);
}

async function syncTable(
  client: CoreClient,
  table:
    | 'staff'
    | 'customers'
    | 'services'
    | 'schedules'
    | 'payments'
    | 'expenses'
    | 'income_entries'
    | 'consultations'
    | 'notifications'
    | 'attendance_sessions',
  orgId: string,
  currentIds: string[],
  upsertAll: () => Promise<void>
): Promise<void> {
  const { data: existing, error } = await client
    .from(table)
    .select('id')
    .eq('organization_id', orgId);

  if (error) {
    console.error(`Failed to fetch ${table} for sync:`, error);
    return;
  }

  const toDelete = diffIds((existing || []).map((r) => r.id), currentIds);
  if (toDelete.length > 0) {
    const { error: deleteError } = await client.from(table).delete().in('id', toDelete);
    if (deleteError) console.error(`Failed to delete from ${table}:`, deleteError);
  }

  await upsertAll();
}

function logErrors(errors: Record<string, unknown>): void {
  for (const [key, err] of Object.entries(errors)) {
    if (err) console.error(`Failed to load ${key}:`, err);
  }
}
