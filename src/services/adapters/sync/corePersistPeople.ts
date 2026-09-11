import type {
  AcademySettings,
  Parent,
  Student,
  Teacher,
} from '../../../types';
import { readLocal, writeLocal } from '../localStorageEngine';
import { STORAGE_KEYS } from '../storageKeys';
import {
  parentToCustomerRow,
  studentContactRow,
  studentToCustomerRow,
  teacherToStaffRow,
} from './entityMappers';
import type { ParentStudentLink } from '../../../core/parent/types';
import { linkToRow } from './parentLinkEntityMappers';
import type { PersistAbortGuard, SyncCache } from './syncTypes';
import { requireCacheList, upsertThenDiffDeleteByKeys } from './persistHelpers';
import type { CoreClient } from './corePersistSyncTable';
import { syncTable } from './corePersistSyncTable';

export async function persistSettings(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  const settings = cache.get<AcademySettings>(STORAGE_KEYS.SETTINGS);
  if (!settings) return;

  // LOCAL_ONLY 슬롯 모집 상태를 settings 미러에 합쳐 원격 반영
  const slotRecruitments =
    readLocal<NonNullable<AcademySettings['slotRecruitments']>>(
      STORAGE_KEYS.SLOT_RECRUITMENTS,
      settings.slotRecruitments || []
    );
  const payload: AcademySettings = { ...settings, slotRecruitments };

  const { error } = await client
    .from('organizations')
    .update({ settings: payload as never })
    .eq('id', orgId);

  if (error) console.error('Failed to persist settings:', error);
  writeLocal(STORAGE_KEYS.SETTINGS, payload);
  writeLocal(STORAGE_KEYS.SLOT_RECRUITMENTS, slotRecruitments);
}

function linkCompositeKey(parentId: string, studentId: string): string {
  return `${parentId}:${studentId}`;
}

export async function persistStaff(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const teachers = requireCacheList<Teacher>(cache, STORAGE_KEYS.TEACHERS, 'staff');
  if (!teachers) return;

  await syncTable(
    client,
    'staff',
    orgId,
    teachers.map((t) => t.id),
    async () => {
      for (const teacher of teachers) {
        if (isAborted()) return;
        const { error } = await client.from('staff').upsert(teacherToStaffRow(teacher, orgId));
        if (error) console.error('Failed to upsert staff:', error);
      }
    },
    { cachePresent: true, context: 'staff', isAborted }
  );
  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.TEACHERS, teachers);
}

export async function persistCustomers(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  // students∪parents가 동일 customers 테이블 — 한쪽 누락 시 diff-delete 금지
  if (!cache.has(STORAGE_KEYS.STUDENTS) || !cache.has(STORAGE_KEYS.PARENTS)) {
    console.error('[sync] Refusing customers persist: STUDENTS/PARENTS cache incomplete');
    return;
  }
  const students = cache.get<Student[]>(STORAGE_KEYS.STUDENTS) || [];
  const parents = cache.get<Parent[]>(STORAGE_KEYS.PARENTS) || [];
  const allIds = [...students.map((s) => s.id), ...parents.map((p) => p.id)];

  await syncTable(
    client,
    'customers',
    orgId,
    allIds,
    async () => {
      const pinMap = new Map(
        (cache.get<{ customerId: string; pinHash: string }[]>(STORAGE_KEYS.CUSTOMER_PINS) || []).map(
          (p) => [p.customerId, p.pinHash]
        )
      );
      const links = cache.get<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS) || [];

      for (const student of students) {
        if (isAborted()) return;
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
        if (isAborted()) return;
        const { error } = await client.from('customers').upsert(parentToCustomerRow(parent, orgId));
        if (error) console.error('Failed to upsert parent:', error);
      }
    },
    { cachePresent: true, context: 'customers', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.STUDENTS, students);
  writeLocal(STORAGE_KEYS.PARENTS, parents);
}

export async function persistCustomerPins(
  client: CoreClient,
  orgId: string,
  cache: SyncCache
): Promise<void> {
  if (!cache.has(STORAGE_KEYS.CUSTOMER_PINS)) return;
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

export async function persistParentStudentLinks(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const links = requireCacheList<ParentStudentLink>(
    cache,
    STORAGE_KEYS.PARENT_STUDENT_LINKS,
    'parent_student_links'
  );
  if (!links) return;

  const rows = links.map((l) => linkToRow(l, orgId));
  const currentKeys = rows.map((r) =>
    linkCompositeKey(r.parent_customer_id, r.student_customer_id)
  );

  // upsert 먼저 — 빈 캐시 wipe-all 금지, composite-key diff만 삭제
  await upsertThenDiffDeleteByKeys({
    context: 'parent_student_links',
    cachePresent: true,
    currentKeys,
    isAborted,
    upsertAll: async () => {
      for (const row of rows) {
        if (isAborted()) return;
        const { error } = await client.from('parent_student_links').upsert(row, {
          onConflict: 'organization_id,parent_customer_id,student_customer_id',
        });
        if (error) console.error('Failed to upsert parent_student_link:', error);
      }
    },
    fetchRemoteKeys: async () => {
      const { data: existing, error } = await client
        .from('parent_student_links')
        .select('parent_customer_id, student_customer_id')
        .eq('organization_id', orgId);
      return {
        keys: (existing || []).map((r) =>
          linkCompositeKey(r.parent_customer_id, r.student_customer_id)
        ),
        error,
      };
    },
    deleteKey: async (key) => {
      const [parentId, studentId] = key.split(':');
      if (!parentId || !studentId) return { error: null };
      const { error } = await client
        .from('parent_student_links')
        .delete()
        .eq('organization_id', orgId)
        .eq('parent_customer_id', parentId)
        .eq('student_customer_id', studentId);
      return { error };
    },
  });

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.PARENT_STUDENT_LINKS, links);
}
