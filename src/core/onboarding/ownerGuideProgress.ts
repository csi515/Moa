import type { NavTab } from '@/context/AppContext';
import type { IndustryType } from '@/core/industry/types';
import { normalizeIndustryType } from '@/core/industry/types';
import { StorageService } from '@/services/storage';
import type { AcademySettings } from '@/types';
import { OWNER_GUIDE_WORKFLOW } from './ownerGuideSteps';
import type { OwnerGuideSettings, OwnerGuideStepStatus } from './types';

const TAB_USAGE_CHECK: Partial<Record<NavTab, () => boolean>> = {
  students: () => StorageService.getStudents().length > 0,
  members: () => StorageService.getStudents().length > 0,
  parents: () => StorageService.getParents().length > 0,
  consultations: () => StorageService.getConsultations().length > 0,
  classes: () => StorageService.getClasses().length > 0,
  timetable: () => StorageService.getClasses().length > 0,
  services: () => StorageService.getServiceOfferings().length > 0,
  bookings: () => StorageService.getBookings().length > 0,
  attendance: () => StorageService.getAttendanceSessions().length > 0,
  tuition: () => StorageService.getInvoices().length > 0,
  unpaid: () => StorageService.getInvoices().some((inv) => inv.status !== 'paid'),
  journals: () => StorageService.getCareJournals().length > 0,
  medications: () => StorageService.getMedicationRequests().length > 0,
  notices: () => StorageService.getNotifications().length > 0,
  teachers: () => StorageService.getTeachers().length > 0,
  instructors: () => StorageService.getTeachers().length > 0,
  makeups: () => StorageService.getMakeupItems().length > 0,
  lessons: () => StorageService.getLessonRecords().length > 0,
  practice: () => StorageService.getPracticeRecords().length > 0,
  textbooks: () => StorageService.getTextbookSales().length > 0,
  finance: () =>
    StorageService.getExpenses().length > 0 || StorageService.getIncomeEntries().length > 0,
  income: () => StorageService.getIncomeEntries().length > 0,
  expenses: () => StorageService.getExpenses().length > 0,
  calendar: () => StorageService.getEvents().length > 0,
  recitals: () => StorageService.getEvents().some((e) => e.type === 'recital'),
  curriculum: () => StorageService.getCurriculumLevels().length > 0,
  assignments: () => StorageService.getWeeklyAssignments().length > 0,
  achievements: () => StorageService.getAchievements().length > 0,
  reports: () => StorageService.getLearningReports().length > 0,
  resources: () => StorageService.getSongs().length > 0,
  settings: () => Boolean(StorageService.getSettings().name?.trim()),
};

export function isGuideTabUsed(tab: NavTab): boolean {
  return TAB_USAGE_CHECK[tab]?.() ?? false;
}

export function getOwnerGuideSettings(settings: AcademySettings): OwnerGuideSettings {
  return settings.features?.ownerGuide ?? {};
}

export function shouldShowOwnerGuideWizard(settings: AcademySettings): boolean {
  const guide = getOwnerGuideSettings(settings);
  return !guide.wizardCompleted && !guide.wizardSkipped;
}

export function saveOwnerGuideSettings(
  patch: Partial<OwnerGuideSettings>,
  settings: AcademySettings
): Partial<AcademySettings> {
  return {
    features: {
      ...settings.features,
      ownerGuide: {
        ...getOwnerGuideSettings(settings),
        ...patch,
      },
    },
  };
}

export function getOwnerWorkflowSteps(
  industry: IndustryType | string | null | undefined,
  allowedTabs: NavTab[]
): OwnerGuideStepStatus[] {
  const type = normalizeIndustryType(industry);
  return OWNER_GUIDE_WORKFLOW[type]
    .filter((step) => allowedTabs.includes(step.tab))
    .map((step, index) => ({
      ...step,
      stepNumber: index + 1,
      completed: isGuideTabUsed(step.tab),
    }));
}

export function countCompletedSteps(steps: OwnerGuideStepStatus[]): {
  completed: number;
  total: number;
} {
  const completed = steps.filter((step) => step.completed).length;
  return { completed, total: steps.length };
}
