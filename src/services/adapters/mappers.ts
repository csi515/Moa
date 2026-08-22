import type { AcademySettings, Teacher } from '../../types';
import type { Json } from '../../lib/supabase/database.types';
import type { OrganizationSettingsPayload, StaffMetadata } from './types';

/** Teacher → core.staff row 변환 */
export function teacherToStaffRow(teacher: Teacher, organizationId: string) {
  const metadata: StaffMetadata = {
    hireDate: teacher.hireDate,
    specialty: teacher.specialty,
    salary: teacher.salary,
    color: teacher.color,
    memo: teacher.memo,
    classIds: teacher.classIds,
  };

  return {
    id: teacher.id,
    organization_id: organizationId,
    name: teacher.name,
    phone: teacher.phone || null,
    email: teacher.email || null,
    status: teacher.status,
    metadata: metadata as unknown as Json,
  };
}

/** core.staff row → Teacher 변환 */
export function staffRowToTeacher(row: {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  metadata: Json;
}): Teacher {
  const meta = (row.metadata || {}) as StaffMetadata;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    email: row.email || undefined,
    hireDate: meta.hireDate || new Date().toISOString().slice(0, 10),
    status: (row.status as Teacher['status']) || 'active',
    specialty: meta.specialty,
    salary: meta.salary,
    color: meta.color,
    memo: meta.memo,
    classIds: meta.classIds,
  };
}

/** organizations.settings JSONB → AcademySettings */
export function parseOrganizationSettings(
  settings: Json | null | undefined,
  fallback: AcademySettings
): AcademySettings {
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return fallback;
  }
  return { ...fallback, ...(settings as OrganizationSettingsPayload) };
}
