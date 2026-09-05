import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import type { GlobalStudent, ParentPortalTree, StudentEnrollment } from '../types/globalParent';
import { ACTIVE_ENROLLMENT_STATUSES } from '../types/globalParent';
import { fetchParentPortalTree } from '../services/parentPortalService';

export type ParentShellStep = 'children' | 'academies' | 'portal';

interface ParentPortalContextType {
  portalTree: ParentPortalTree | null;
  loading: boolean;
  error: string | null;
  step: ParentShellStep;
  selectedStudent: GlobalStudent | null;
  selectedEnrollment: StudentEnrollment | null;
  refreshPortalTree: () => Promise<void>;
  selectStudent: (student: GlobalStudent) => void;
  selectEnrollment: (enrollment: StudentEnrollment) => void;
  goToChildren: () => void;
  goToAcademies: () => void;
}

const ParentPortalContext = createContext<ParentPortalContextType | undefined>(undefined);

export const ParentPortalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portalTree, setPortalTree] = useState<ParentPortalTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<ParentShellStep>('children');
  const [selectedStudent, setSelectedStudent] = useState<GlobalStudent | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);

  const refreshPortalTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tree = await fetchParentPortalTree();
      setPortalTree(tree);
    } catch (err) {
      setError(err instanceof Error ? err.message : '포털 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshPortalTree();
  }, [refreshPortalTree]);

  const selectStudent = useCallback((student: GlobalStudent) => {
    setSelectedStudent(student);
    setSelectedEnrollment(null);
    const active = student.enrollments.filter((e) =>
      ACTIVE_ENROLLMENT_STATUSES.includes(e.status)
    );
    if (active.length === 1) {
      setSelectedEnrollment(active[0]);
      setStep('portal');
    } else if (active.length === 0 && student.enrollments.length === 1) {
      setSelectedEnrollment(student.enrollments[0]);
      setStep('portal');
    } else {
      setStep('academies');
    }
  }, []);

  const selectEnrollment = useCallback((enrollment: StudentEnrollment) => {
    setSelectedEnrollment(enrollment);
    setStep('portal');
  }, []);

  const goToChildren = useCallback(() => {
    setStep('children');
    setSelectedStudent(null);
    setSelectedEnrollment(null);
  }, []);

  const goToAcademies = useCallback(() => {
    setStep('academies');
    setSelectedEnrollment(null);
  }, []);

  const value = useMemo(
    () => ({
      portalTree,
      loading,
      error,
      step,
      selectedStudent,
      selectedEnrollment,
      refreshPortalTree,
      selectStudent,
      selectEnrollment,
      goToChildren,
      goToAcademies,
    }),
    [
      portalTree,
      loading,
      error,
      step,
      selectedStudent,
      selectedEnrollment,
      refreshPortalTree,
      selectStudent,
      selectEnrollment,
      goToChildren,
      goToAcademies,
    ]
  );

  return <ParentPortalContext.Provider value={value}>{children}</ParentPortalContext.Provider>;
};

export function useParentPortal(): ParentPortalContextType {
  const ctx = useContext(ParentPortalContext);
  if (!ctx) {
    throw new Error('useParentPortal must be used within ParentPortalProvider');
  }
  return ctx;
}
