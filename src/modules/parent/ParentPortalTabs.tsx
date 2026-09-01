import React from 'react';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import type { IndustryType } from '@/core/industry/types';
import { ParentHomeView } from './views/ParentHomeView';
import { ParentAttendanceView } from './views/ParentAttendanceView';
import { ParentTuitionView } from './views/ParentTuitionView';
import { ParentAssignmentsView } from './views/ParentAssignmentsView';
import { ParentProgressView } from './views/ParentProgressView';
import { ParentReportsView } from './views/ParentReportsView';
import { ParentEventsView } from './views/ParentEventsView';
import { ParentNoticesView } from './views/ParentNoticesView';
import { ParentCareJournalView } from './views/ParentCareJournalView';
import { ParentMedicationView } from './views/ParentMedicationView';
import { ParentScheduleView } from './views/ParentScheduleView';
import { ParentBookingsView } from './views/ParentBookingsView';

export function ParentPortalTabs({
  tab,
  student,
  organizationId,
  readOnly = false,
  showToast,
  onRefresh,
  onNavigate,
  industryType = 'piano',
}: {
  tab: ParentPortalTab;
  student: Student;
  organizationId: string;
  readOnly?: boolean;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onRefresh: () => void;
  onNavigate: (t: ParentPortalTab) => void;
  industryType?: IndustryType | string;
}) {
  switch (tab) {
    case 'home':
      return (
        <ParentHomeView
          student={student}
          organizationId={organizationId}
          readOnly={readOnly}
          onNavigate={onNavigate}
          industryType={industryType}
        />
      );
    case 'attendance':
      return (
        <ParentAttendanceView
          student={student}
          organizationId={organizationId}
          industryType={industryType}
        />
      );
    case 'tuition':
      return <ParentTuitionView student={student} industryType={industryType} />;
    case 'assignments':
      return <ParentAssignmentsView student={student} readOnly={readOnly} showToast={showToast} onRefresh={onRefresh} />;
    case 'progress':
      return <ParentProgressView student={student} />;
    case 'reports':
      return <ParentReportsView student={student} />;
    case 'events':
      return <ParentEventsView student={student} industryType={industryType} />;
    case 'notices':
      return <ParentNoticesView student={student} organizationId={organizationId} />;
    case 'journals':
      return <ParentCareJournalView student={student} />;
    case 'medications':
      return (
        <ParentMedicationView
          student={student}
          readOnly={readOnly}
          showToast={showToast}
          onRefresh={onRefresh}
        />
      );
    case 'schedule':
      return <ParentScheduleView student={student} />;
    case 'bookings':
      return <ParentBookingsView student={student} />;
    default:
      return null;
  }
}
