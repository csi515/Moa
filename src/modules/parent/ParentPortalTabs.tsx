import React from 'react';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { ParentHomeView } from './views/ParentHomeView';
import { ParentAttendanceView } from './views/ParentAttendanceView';
import { ParentTuitionView } from './views/ParentTuitionView';
import { ParentAssignmentsView } from './views/ParentAssignmentsView';
import { ParentProgressView } from './views/ParentProgressView';
import { ParentReportsView } from './views/ParentReportsView';
import { ParentEventsView } from './views/ParentEventsView';
import { ParentNoticesView } from './views/ParentNoticesView';

export function ParentPortalTabs({
  tab,
  student,
  showToast,
  onRefresh,
}: {
  tab: ParentPortalTab;
  student: Student;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onRefresh: () => void;
}) {
  switch (tab) {
    case 'home':
      return <ParentHomeView student={student} onNavigate={() => {}} />;
    case 'attendance':
      return <ParentAttendanceView student={student} />;
    case 'tuition':
      return <ParentTuitionView student={student} />;
    case 'assignments':
      return <ParentAssignmentsView student={student} showToast={showToast} onRefresh={onRefresh} />;
    case 'progress':
      return <ParentProgressView student={student} />;
    case 'reports':
      return <ParentReportsView student={student} />;
    case 'events':
      return <ParentEventsView student={student} />;
    case 'notices':
      return <ParentNoticesView student={student} />;
    default:
      return null;
  }
}
