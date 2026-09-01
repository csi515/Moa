import React from 'react';
import { normalizeIndustryType, type IndustryType } from '@/core/industry/types';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { GymParentHome } from './GymParentHome';
import { PianoParentHome } from './PianoParentHome';
import { PilatesParentHome } from './PilatesParentHome';
import { DaycareParentHome } from './DaycareParentHome';

export function ParentHomeView({
  student,
  organizationId,
  readOnly = false,
  onNavigate,
  industryType = 'piano',
}: {
  student: Student;
  organizationId: string;
  readOnly?: boolean;
  onNavigate: (t: ParentPortalTab) => void;
  industryType?: IndustryType | string;
}) {
  const industry = normalizeIndustryType(industryType);
  if (industry === 'daycare') {
    return (
      <DaycareParentHome
        student={student}
        organizationId={organizationId}
        readOnly={readOnly}
        onNavigate={onNavigate}
      />
    );
  }
  if (industry === 'gym') {
    return (
      <GymParentHome
        student={student}
        organizationId={organizationId}
        onNavigate={onNavigate}
      />
    );
  }
  if (industry === 'pilates') {
    return <PilatesParentHome student={student} organizationId={organizationId} onNavigate={onNavigate} />;
  }
  return (
    <PianoParentHome
      student={student}
      organizationId={organizationId}
      onNavigate={onNavigate}
    />
  );
}
