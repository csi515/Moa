import { useMemo } from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import type { Student } from '@/types';

/** 학부모 역할 — 본인 자녀 데이터만 접근 */
export function useParentScope() {
  const { isParent, parentCustomerId } = usePermissions();

  const myStudents = useMemo((): Student[] => {
    if (!isParent || !parentCustomerId) return [];
    return StorageService.getStudentsForParent(parentCustomerId);
  }, [isParent, parentCustomerId]);

  const myStudentIds = useMemo(() => new Set(myStudents.map((s) => s.id)), [myStudents]);

  const scopeByStudent = useMemo(
    () =>
      <T extends { studentId: string }>(items: T[]): T[] => {
        if (!isParent) return items;
        return items.filter((i) => myStudentIds.has(i.studentId));
      },
    [isParent, myStudentIds]
  );

  return {
    isParent,
    parentCustomerId,
    myStudents,
    myStudentIds,
    scopeByStudent,
    canAccessStudent: (studentId: string) => !isParent || myStudentIds.has(studentId),
  };
}
