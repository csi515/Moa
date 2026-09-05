import type { AcademySettings, User } from '../../types';
import { STORAGE_KEYS } from '../adapters';
import { getIndustryType } from '../adapters/storageContext';
import { resolveAttendanceEnabledForBackfill } from '../../core/attendance/features';
import { DEFAULT_SETTINGS, getItem, setItem, type StorageApi } from './helpers';

/** 설정·사용자·온보딩·백업 */
export function createSettingsStorage(api: StorageApi) {
  return {
    getActiveUser(): User {
      return getItem<User>(STORAGE_KEYS.ACTIVE_USER, {
        id: 'owner',
        name: '원장님',
        role: 'owner',
        email: '',
      });
    },

    setActiveUser(user: User): void {
      setItem(STORAGE_KEYS.ACTIVE_USER, user);
    },

    getSettings(): AcademySettings {
      return getItem<AcademySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    },

    updateSettings(settings: Partial<AcademySettings>): AcademySettings {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      setItem(STORAGE_KEYS.SETTINGS, updated);
      return updated;
    },

    saveSettings(settings: AcademySettings): AcademySettings {
      setItem(STORAGE_KEYS.SETTINGS, settings);
      return settings;
    },

    /**
     * 기존 데이터에 features.attendance.enabled가 없으면 확정 저장.
     * PIN/세션 있으면 true, 없으면 false(MANUAL).
     */
    backfillAttendanceFeatureFlag(): { changed: boolean; enabled: boolean } {
      const settings = this.getSettings();
      const pins = (api.getCustomerPins as () => unknown[])();
      const sessions = (api.getAttendanceSessions as () => unknown[])();
      const hasPinOrSessionData = pins.length > 0 || sessions.length > 0;
      const result = resolveAttendanceEnabledForBackfill({
        settings,
        hasPinOrSessionData,
      });
      if (result.changed) {
        this.saveSettings(result.settings);
      }
      return { changed: result.changed, enabled: result.enabled };
    },

    exportDatabaseJSON(): string {
      const fullDump = {
        students: (api.getStudents as () => unknown[])(),
        parents: (api.getParents as () => unknown[])(),
        teachers: (api.getTeachers as () => unknown[])(),
        classes: (api.getClasses as () => unknown[])(),
        attendance: (api.getAttendance as () => unknown[])(),
        attendanceSessions: (api.getAttendanceSessions as () => unknown[])(),
        customerPins: (api.getCustomerPins as () => unknown[])(),
        parentStudentLinks: (api.getParentStudentLinks as () => unknown[])(),
        invoices: (api.getInvoices as () => unknown[])(),
        expenses: (api.getExpenses as () => unknown[])(),
        incomeEntries: (api.getIncomeEntries as () => unknown[])(),
        consultations: (api.getConsultations as () => unknown[])(),
        practiceRecords: (api.getPracticeRecords as () => unknown[])(),
        lessonRecords: (api.getLessonRecords as () => unknown[])(),
        textbooks: (api.getTextbooks as () => unknown[])(),
        songs: (api.getSongs as () => unknown[])(),
        events: (api.getEvents as () => unknown[])(),
        performanceVideos: (api.getPerformanceVideos as () => unknown[])(),
        notifications: (api.getNotifications as () => unknown[])(),
        settings: (api.getSettings as () => unknown)(),
        careJournals: getItem(STORAGE_KEYS.CARE_JOURNALS, []),
        medicationRequests: getItem(STORAGE_KEYS.MEDICATION_REQUESTS, []),
        exportedAt: new Date().toISOString(),
      };
      return JSON.stringify(fullDump, null, 2);
    },

    importDatabaseJSON(jsonStr: string): boolean {
      try {
        const data = JSON.parse(jsonStr) as Record<string, unknown>;
        if (data.students) setItem(STORAGE_KEYS.STUDENTS, data.students);
        if (data.parents) setItem(STORAGE_KEYS.PARENTS, data.parents);
        if (data.teachers) setItem(STORAGE_KEYS.TEACHERS, data.teachers);
        if (data.classes) setItem(STORAGE_KEYS.CLASSES, data.classes);
        if (data.attendance) setItem(STORAGE_KEYS.ATTENDANCE, data.attendance);
        if (data.attendanceSessions) setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, data.attendanceSessions);
        if (data.customerPins) setItem(STORAGE_KEYS.CUSTOMER_PINS, data.customerPins);
        if (data.parentStudentLinks) setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, data.parentStudentLinks);
        if (data.invoices) setItem(STORAGE_KEYS.INVOICES, data.invoices);
        if (data.expenses) setItem(STORAGE_KEYS.EXPENSES, data.expenses);
        if (data.incomeEntries) setItem(STORAGE_KEYS.INCOME_ENTRIES, data.incomeEntries);
        if (data.consultations) setItem(STORAGE_KEYS.CONSULTATIONS, data.consultations);
        if (data.practiceRecords) setItem(STORAGE_KEYS.PRACTICE_RECORDS, data.practiceRecords);
        if (data.lessonRecords) setItem(STORAGE_KEYS.LESSON_RECORDS, data.lessonRecords);
        if (data.textbooks) setItem(STORAGE_KEYS.TEXTBOOKS, data.textbooks);
        if (data.songs) setItem(STORAGE_KEYS.SONGS, data.songs);
        if (data.events) setItem(STORAGE_KEYS.EVENTS, data.events);
        if (data.performanceVideos) setItem(STORAGE_KEYS.PERFORMANCE_VIDEOS, data.performanceVideos);
        if (data.notifications) setItem(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
        if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
        if (data.careJournals) setItem(STORAGE_KEYS.CARE_JOURNALS, data.careJournals);
        if (data.medicationRequests) setItem(STORAGE_KEYS.MEDICATION_REQUESTS, data.medicationRequests);
        return true;
      } catch (error) {
        console.error('Import failed:', error);
        return false;
      }
    },

    exportAllData(): string {
      return this.exportDatabaseJSON();
    },

    importAllData(jsonStr: string): boolean {
      return this.importDatabaseJSON(jsonStr);
    },

    isOnboardingComplete(): boolean {
      return getItem<boolean>(STORAGE_KEYS.INITIALIZED, false);
    },

    setOnboardingComplete(complete = true): void {
      setItem(STORAGE_KEYS.INITIALIZED, complete);
    },

    isNewOrganization(): boolean {
      const industry = getIndustryType();
      if (industry === 'pilates') {
        return (
          (api.getStudents as () => unknown[])().length === 0 &&
          (api.getServiceOfferings as () => unknown[])().length === 0 &&
          !this.getSettings().name?.trim()
        );
      }
      return (
        (api.getStudents as () => unknown[])().length === 0 &&
        (api.getClasses as () => unknown[])().length === 0 &&
        !this.getSettings().name?.trim()
      );
    },

    shouldShowOnboarding(): boolean {
      return !this.isOnboardingComplete() && this.isNewOrganization();
    },
  };
}
