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
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
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
   * 명시적 전역 UI 무효화 카운터.
   * StorageService 매 변경으로 증가하지 않음 — triggerRefresh() 또는 hydrate('*') 연동 화면만.
   */
  refreshKey: number;
  /** 설정 저장·교차 탭 등 storage 키 구독만으로 부족한 경우의 명시적 갱신 */
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentDetailTab, setSelectedStudentDetailTab] =
    useState<StudentDetailTab | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getActiveUser());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
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
      setToasts((prev) => [...prev, { id, message, type, title }]);
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
