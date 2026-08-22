import { useMemo } from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import type { Booking } from '@/core/types/schedule';
import type {
  AcademyEvent,
  ClassItem,
  Consultation,
  LessonRecord,
  MakeupItem,
  Student,
} from '@/types';

export function useStaffScope() {
  const { isStaff, staffId } = usePermissions();

  const isScoped = isStaff && !!staffId;

  const scopeStudents = useMemo(
    () =>
      (students: Student[]): Student[] => {
        if (!isScoped) return students;
        return students.filter((s) => s.teacherId === staffId);
      },
    [isScoped, staffId]
  );

  const scopeClasses = useMemo(
    () =>
      (classes: ClassItem[]): ClassItem[] => {
        if (!isScoped) return classes;
        return classes.filter((c) => c.teacherId === staffId);
      },
    [isScoped, staffId]
  );

  const scopeBookings = useMemo(
    () =>
      (bookings: Booking[]): Booking[] => {
        if (!isScoped) return bookings;
        return bookings.filter((b) => b.staffId === staffId);
      },
    [isScoped, staffId]
  );

  const getMyStudentIds = useMemo(
    () =>
      (students: Student[]): Set<string> => {
        if (!isScoped) return new Set(students.map((s) => s.id));
        return new Set(students.filter((s) => s.teacherId === staffId).map((s) => s.id));
      },
    [isScoped, staffId]
  );

  const scopeMembersForPilates = useMemo(
    () =>
      (members: Student[], bookings: Booking[]): Student[] => {
        if (!isScoped) return members;
        const bookingMemberIds = new Set(
          bookings
            .filter((b) => b.staffId === staffId && b.customerId)
            .map((b) => b.customerId as string)
        );
        return members.filter((m) => m.teacherId === staffId || bookingMemberIds.has(m.id));
      },
    [isScoped, staffId]
  );

  const scopeByStudentIds = useMemo(
    () =>
      <T extends { studentId: string }>(items: T[], students: Student[]): T[] => {
        if (!isScoped) return items;
        const ids = getMyStudentIds(students);
        return items.filter((i) => ids.has(i.studentId));
      },
    [isScoped, getMyStudentIds]
  );

  const scopeLessons = useMemo(
    () =>
      (lessons: LessonRecord[]): LessonRecord[] => {
        if (!isScoped) return lessons;
        return lessons.filter((l) => l.teacherId === staffId);
      },
    [isScoped, staffId]
  );

  const scopeConsultations = useMemo(
    () =>
      (consultations: Consultation[]): Consultation[] => {
        if (!isScoped) return consultations;
        return consultations.filter((c) => c.counselorId === staffId);
      },
    [isScoped, staffId]
  );

  const scopeMakeupItems = useMemo(
    () =>
      (items: MakeupItem[], students: Student[]): MakeupItem[] => {
        if (!isScoped) return items;
        const ids = getMyStudentIds(students);
        return items.filter((m) => ids.has(m.studentId));
      },
    [isScoped, getMyStudentIds]
  );

  const scopeRecitalEvents = useMemo(
    () =>
      (events: AcademyEvent[], students: Student[]): AcademyEvent[] => {
        if (!isScoped) return events;
        const ids = getMyStudentIds(students);
        return events.filter((ev) => (ev.participantIds || []).some((pid) => ids.has(pid)));
      },
    [isScoped, getMyStudentIds]
  );

  return {
    isStaff,
    staffId,
    isScoped,
    scopeStudents,
    scopeClasses,
    scopeBookings,
    scopeMembersForPilates,
    scopeByStudentIds,
    scopeLessons,
    scopeConsultations,
    scopeMakeupItems,
    scopeRecitalEvents,
    getMyStudentIds,
  };
}
