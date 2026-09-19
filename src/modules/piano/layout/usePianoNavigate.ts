import { useCallback } from 'react';
import { useApp, type NavTab } from '@/context/AppContext';

/** 피아노 사이드바·하단 네비 공통 이동 (학생 탭 진입 시 상세 선택 초기화) */
export function usePianoNavigate() {
  const { setActiveTab, setSelectedStudentId } = useApp();

  return useCallback(
    (tab: NavTab) => {
      if (tab === 'students') setSelectedStudentId(null);
      setActiveTab(tab);
    },
    [setActiveTab, setSelectedStudentId]
  );
}
