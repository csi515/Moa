import type { Student } from '@/types';

/** 반 ID가 있으면 해당 반 재원생, 없으면 전체 목록 */
export function resolveTargetStudents(
  students: Student[],
  classId?: string
): Student[] {
  if (!classId) return students;
  return students.filter((s) => s.classIds?.includes(classId));
}

export function resolveTargetStudentIds(students: Student[], classId?: string): string[] {
  return resolveTargetStudents(students, classId).map((s) => s.id);
}
