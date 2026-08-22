import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { StorageService } from '../services/storage';
import { User } from '../types';

export type NavTab = 
  | 'dashboard' 
  | 'students' 
  | 'parents' 
  | 'classes' 
  | 'timetable' 
  | 'attendance' 
  | 'tuition' 
  | 'textbooks'
  | 'expenses' 
  | 'consultations' 
  | 'practice' 
  | 'lessons' 
  | 'resources' 
  | 'teachers' 
  | 'calendar' 
  | 'settings';

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
  currentUser: User;
  toasts: ToastMessage[];
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning', title?: string) => void;
  dismissToast: (id: string) => void;
  confirmDialog: ConfirmDialogOptions | null;
  openConfirmDialog: (options: ConfirmDialogOptions) => void;
  closeConfirmDialog: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getActiveUser());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    const unsubscribe = StorageService.subscribe(() => {
      setCurrentUser(StorageService.getActiveUser());
      triggerRefresh();
    });
    return unsubscribe;
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    setToasts((prev) => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const openConfirmDialog = (options: ConfirmDialogOptions) => {
    setConfirmDialog(options);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(null);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedStudentId,
        setSelectedStudentId,
        currentUser,
        toasts,
        showToast,
        dismissToast,
        confirmDialog,
        openConfirmDialog,
        closeConfirmDialog,
        globalSearchQuery,
        setGlobalSearchQuery,
        refreshKey,
        triggerRefresh
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
