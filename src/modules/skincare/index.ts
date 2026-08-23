export { ModuleLabelsProvider, useModuleLabels } from './config/ModuleLabelsProvider';
export { skincareModuleLabels, type ModuleLabels } from './config/labels';
export { SkincareAppContent } from './SkincareAppContent';
export { SkincareDashboardView } from './components/dashboard/SkincareDashboardView';
export { TreatmentMenuView } from './components/treatments/TreatmentMenuView';
export { CareProgramManagementView } from './components/care/CareProgramManagementView';
/** Core Customer(Student) 재사용 — 피부샵 고객 목록 */
export { StudentListView as CustomerListView } from '@/modules/piano/components/students/StudentListView';
/** Core Staff(Teacher) 재사용 — 관리사 목록 */
export { TeacherManagementView as TherapistListView } from '@/modules/piano/components/teachers/TeacherManagementView';
export { CareProgramService } from './services/careProgramService';
export type { CareProgram, CareEnrollment } from './types/careProgram';
