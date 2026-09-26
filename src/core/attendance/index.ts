/** @deprecated 신규 코드는 `@/capabilities/attendance`를 사용한다. */
export {
  AttendanceManagementView,
  PinCheckInKioskView,
  AttendanceKioskPage,
  CustomerPinPanel,
  AttendanceFeatureToggle,
  OnboardingAttendanceChoice,
  PIN_ATTENDANCE_DIRECTOR_COPY,
  PIN_ATTENDANCE_PARENT_COPY,
  runPinAttendanceValidation,
  PIN_ATTENDANCE_SCENARIO_CHECKLIST,
} from '@/capabilities/attendance';
export * from '@/capabilities/attendance/domain/types';
export * from '@/capabilities/attendance/domain/features';
export * from '@/capabilities/attendance/domain/dayAttendance';
export * from '@/capabilities/attendance/application/pinCheckInSideEffects';
export * from '@/capabilities/attendance/application/attendanceService';
export * from '@/capabilities/attendance/application/pinService';
