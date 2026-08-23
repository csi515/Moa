export { ModuleLabelsProvider, useModuleLabels } from './config/ModuleLabelsProvider';
export { academyModuleLabels, type ModuleLabels } from './config/labels';
export { AcademyAppContent } from './AcademyAppContent';
export { AcademyDashboardView } from './components/dashboard/AcademyDashboardView';
export { HomeworkManagementView } from './components/homework/HomeworkManagementView';
export { ExamManagementView } from './components/exams/ExamManagementView';
export { AcademySubjectsPanel } from './components/settings/AcademySubjectsPanel';
export {
  ACADEMY_SUBJECT_CATALOG,
  DEFAULT_ACADEMY_SUBJECT_IDS,
  getAcademySubjectIds,
  getAcademySubjectOptions,
  getAcademySubjectLabel,
} from './config/subjects';
export { buildAcademyNavSections, buildAcademyBottomNavTabs } from './config/nav';
export { useAcademyLearningContext } from './hooks/useAcademyLearningContext';
export { resolveTargetStudents, resolveTargetStudentIds } from './utils/resolveTargetStudents';
