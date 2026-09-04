import { useEffect, useMemo, useState } from 'react';
import { StorageService } from '@/services/storage';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { reservationService } from '@/core/schedules';
import type { ReservationDetail } from '@/types';
import type { ClassItem, Student, TuitionInvoice } from '@/types';

export interface DirectorTodayData {
  stats: ReturnType<typeof StorageService.getDashboardStats>;
  students: Student[];
  todayClasses: ClassItem[];
  recentUnpaid: TuitionInvoice[];
  unpaidStudentCount: number;
  unpaidTotal: number;
  pendingReservations: ReservationDetail[];
  pendingReservationCount: number;
  makeupPendingCount: number;
  currentMonthLabel: string;
}

/** 원장 홈 — 오늘 업무 중심 데이터 */
export function useDirectorTodayDashboard(): DirectorTodayData & { loadingReservations: boolean } {
  const { currentOrganization } = useOrganization();
  const [pendingReservations, setPendingReservations] = useState<ReservationDetail[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const stats = StorageService.getDashboardStats();
  const students = StorageService.getStudents();
  const recentUnpaid = StorageService.getUnpaidInvoices().slice(0, 5);
  const unpaidStats = StorageService.getUnifiedUnpaidStats();
  const makeupPendingCount = StorageService.getMakeupItems().filter(
    (item) => item.status === 'pending'
  ).length;

  const todayClasses = useMemo(
    () =>
      [...(stats.todayClasses as ClassItem[])].sort((a, b) =>
        (a.startTime || '').localeCompare(b.startTime || '')
      ),
    [stats.todayClasses]
  );

  useEffect(() => {
    if (!currentOrganization?.id) {
      setPendingReservations([]);
      return;
    }

    let cancelled = false;
    setLoadingReservations(true);
    reservationService
      .getOrganizationReservations(currentOrganization.id, 'requested', undefined, 8)
      .then((rows) => {
        if (!cancelled) setPendingReservations(rows);
      })
      .catch(() => {
        if (!cancelled) setPendingReservations([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingReservations(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentOrganization?.id]);

  return {
    stats,
    students,
    todayClasses,
    recentUnpaid,
    unpaidStudentCount: unpaidStats.studentCount ?? stats.unpaidStudentsCount,
    unpaidTotal: unpaidStats.grandTotal ?? stats.totalUnpaidThisMonth,
    pendingReservations,
    pendingReservationCount: pendingReservations.length,
    makeupPendingCount,
    currentMonthLabel: `${parseInt(stats.currentYearMonth.slice(5, 7), 10)}월`,
    loadingReservations,
  };
}
