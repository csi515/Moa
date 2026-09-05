// 업종 공통 학원 운영 UI (원생·반·수납·설정 등)
export { StudentListView } from './components/students/StudentListView';
export { StudentDetailModal } from './components/students/StudentDetailModal';
export { StudentFormModal } from './components/students/StudentFormModal';
export { ParentManagementView } from './components/parents/ParentManagementView';
export { GuardianEnrollmentRequestsView } from './components/enrollments';
export { ClassManagementView } from './components/classes/ClassManagementView';
export { WeeklyTimetableView } from './components/timetable/WeeklyTimetableView';
export { ConsultationRecordsView } from './components/consultations/ConsultationRecordsView';
export { TuitionManagementView } from './components/tuition/TuitionManagementView';
export { UnpaidManagementView } from './components/unpaid/UnpaidManagementView';
export { TeacherManagementView } from './components/teachers/TeacherManagementView';
export { AcademyCalendarView } from './components/calendar/AcademyCalendarView';
export { ClassScheduleHubView } from './components/schedule/ClassScheduleHubView';
export { CustomerHubView } from './components/customers/CustomerHubView';
export { SettingsHubView } from './components/settings/SettingsHubView';
export { AcademySettingsView } from './components/settings/AcademySettingsView';
export {
  ACADEMY_ROOM_KIND_LABEL,
  createAcademyRoom,
  formatAcademyRoomLabel,
  getAcademyRoomNames,
  getConfiguredRooms,
} from './utils/academyRooms';
