import type { GuardianRelationship } from '@/core/parent/types';
import { getCoreClient } from '@/lib/supabase';

export const DEFAULT_ACADEMY_SHARED_FIELDS = ['display_name', 'birth_date'] as const;

export type AcademySharedField = (typeof DEFAULT_ACADEMY_SHARED_FIELDS)[number];

export const ACADEMY_SHARED_FIELD_LABELS: Record<AcademySharedField, string> = {
  display_name: '이름',
  birth_date: '생년월일',
};

export interface RegisterParentChildResult {
  status: 'created' | 'existing';
  studentId: string;
  displayName: string;
  birthDate: string | null;
}

/** 학부모가 자녀 기본정보를 등록 (학원 연결 전) */
export async function registerParentChild(params: {
  displayName: string;
  birthDate?: string | null;
  relationship?: GuardianRelationship;
  isPrimary?: boolean;
}): Promise<RegisterParentChildResult> {
  const { data, error } = await getCoreClient().rpc('parent_register_child', {
    p_display_name: params.displayName.trim(),
    p_birth_date: params.birthDate || null,
    p_relationship: params.relationship ?? 'other',
    p_is_primary: params.isPrimary ?? true,
  });
  if (error) throw error;

  const row = (data ?? {}) as {
    status?: 'created' | 'existing';
    student_id?: string;
    display_name?: string;
    birth_date?: string | null;
  };

  return {
    status: row.status === 'existing' ? 'existing' : 'created',
    studentId: String(row.student_id ?? ''),
    displayName: String(row.display_name ?? params.displayName),
    birthDate: row.birth_date ?? params.birthDate ?? null,
  };
}
