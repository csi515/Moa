import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { StorageService } from '../services/storage';
import { STORAGE_KEYS } from '../services/adapters/storageKeys';
import { User } from '../types';
import {
  MAX_VISIBLE_TOASTS,
  nextWorkStatusId,
  type FeedbackTone,
  type WorkStatusMessage,
} from '@/shared/feedback/feedbackPolicy';

/**
 * AppContext 역할:
 * - UI state: activeTab, selectedStudent*, toast, dialog
 * - session user mirror: currentUser (ACTIVE_USER 변경 시만 갱신)
 * - triggerRefresh / refreshKey: 명시적 전체 UI 무효화(설정 저장 등). storage 매 write마다 올리지 않음.
 *
 * Domain data(students/bookings/…)는 AppContext에 두지 않음 → useStorageRefresh(domain) 구독.
 */

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'parents'
  | 'enrollment-requests'
  | 'classes'
  | 'timetable'
  | 'attendance'
  | 'check-in'
  | 'tuition'
  | 'unpaid'
  | 'textbooks'
  | 'finance'
  | 'income'
  | 'expenses'
  | 'payroll'
  | 'makeups'
  | 'practice-rooms'
  | 'consultations'
  | 'practice'
  | 'lessons'
  | 'resources'
  | 'teachers'
  | 'calendar'
  | 'recitals'
  | 'curriculum'
  | 'assignments'
  | 'achievements'
  | 'song-stamps'
  | 'reports'
  | 'bookings'
  | 'services'
  | 'members'
  | 'instructors'
  | 'passes'
  | 'retail'
  | 'sales'
  | 'inventory'
  | 'shuttle'
  | 'journals'
  | 'medications'
  | 'notices'
  | 'settings'
  | 'account';

export type StudentDetailTab =
  | 'info'
  | 'classes'
  | 'attendance'
  | 'tuition'
  | 'textbooks'
  | 'consultations'
  | 'practice'
  | 'videos'
  | 'memo';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** 세 번째 동작. 강제 로그아웃 등 */
  altText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  onAlt?: () => void;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedStudentId: string | null;
  setSelectedStudentId: (id: string | null) => void;
  selectedStudentDetailTab: StudentDetailTab | null;
  setSelectedStudentDetailTab: (tab: StudentDetailTab | null) => void;
  currentUser: User;
  toasts: ToastMessage[];
  showToast: (
    message: string,
    type?: 'success' | 'error' | 'info' | 'warning',
    title?: string
  ) => void;
  dismissToast: (id: string) => void;
  confirmDialog: ConfirmDialogOptions | null;
  openConfirmDialog: (options: ConfirmDialogOptions) => void;
  closeConfirmDialog: () => void;
  /**
   * 결제/예약/등록처럼 화면에 남겨야 하는 결과.
   * 짧은 성공/경고는 showToast, 필드 수정은 FormField.error.
   */
  workStatus: WorkStatusMessage | null;
  showWorkStatus: (input: { title: string; message: string; tone?: FeedbackTone }) => void;
  clearWorkStatus: () => void;
  /**
   * 명시적 전역 UI 무효화 카운터.
   * StorageService 매 변경으로 증가하지 않음 — triggerRefresh() 또는 hydrate('*') 연동 화면만.
   */
  refreshKey: number;
  /** 설정 저장·교차 탭 등 storage 키 구독만으로 부족한 경우의 명시적 갱신 */
  triggerRefresh: () => void;
}

const WORK_SCROLL_ROOT = '[data-work-scroll-root]';

/** 업무 탭 전환 시 새 화면을 상단에서 시작. 상세 내부 탭은 activeTab을 바꾸지 않는다. */
function resetWorkTabScroll() {
  if (typeof window === 'undefined') return;
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  document.querySelectorAll<HTMLElement>(WORK_SCROLL_ROOT).forEach((el) => {
    el.scrollTop = 0;
  });
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavTab>('dashboard');
  const setActiveTab = useCallback((tab: NavTab) => {
    setActiveTabState((prev) => {
      if (prev !== tab) {
        requestAnimationFrame(resetWorkTabScroll);
      }
      return tab;
    });
  }, []);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentDetailTab, setSelectedStudentDetailTab] =
    useState<StudentDetailTab | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getActiveUser());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [workStatus, setWorkStatus] = useState<WorkStatusMessage | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const unsubscribe = StorageService.subscribe((changedKey) => {
      // currentUser만 — students/bookings 변경으로 AppProvider 전체 재렌더 금지
      if (changedKey === '*' || changedKey === STORAGE_KEYS.ACTIVE_USER) {
        setCurrentUser(StorageService.getActiveUser());
      }
    });
    return unsubscribe;
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'info' | 'warning' = 'success',
      title?: string
    ) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type, title }].slice(-MAX_VISIBLE_TOASTS));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openConfirmDialog = useCallback((options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  }, []);

  const closeConfirmDialog = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const showWorkStatus = useCallback(
    (input: { title: string; message: string; tone?: FeedbackTone }) => {
      setWorkStatus({
        id: nextWorkStatusId(),
        title: input.title,
        message: input.message,
        tone: input.tone ?? 'info',
      });
    },
    []
  );

  const clearWorkStatus = useCallback(() => {
    setWorkStatus(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedStudentId,
        setSelectedStudentId,
        selectedStudentDetailTab,
        setSelectedStudentDetailTab,
        currentUser,
        toasts,
        showToast,
        dismissToast,
        confirmDialog,
        openConfirmDialog,
        closeConfirmDialog,
        workStatus,
        showWorkStatus,
        clearWorkStatus,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export function useOptionalApp(): AppContextType | null {
  return useContext(AppContext) ?? null;
}
