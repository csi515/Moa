import { useMemo } from 'react';
import { useStaffScope } from '@/hooks';
import { useStorageRefresh } from '@/hooks/useStorageRefresh';
import { StorageService } from '@/services/storage';
import { getAcademySubjectOptions } from '@/modules/academy/config/subjects';
import type { Student } from '@/types';

/** 숙제·시험 뷰 공통: 재원생·반·과목·refresh */
export function useAcademyLearningContext() {
  const { scopeStudents } = useStaffScope();
  const refreshKey = useStorageRefresh();

  const settings = StorageService.getSettings();
  const subjectOptions = getAcademySubjectOptions(settings);
  const classes = StorageService.getClasses();
  const students = useMemo(
    () =>
      scopeStudents(StorageService.getStudents().filter((s) => s.status === 'active')),
    [scopeStudents, refreshKey]
  );
  const studentMap = useMemo(
    () => new Map<string, Student>(students.map((s) => [s.id, s])),
    [students]
  );
  const defaultSubjectLabel = subjectOptions[0]?.label || '국어';

  return {
    refreshKey,
    subjectOptions,
    classes,
    students,
    studentMap,
    defaultSubjectLabel,
  };
}
