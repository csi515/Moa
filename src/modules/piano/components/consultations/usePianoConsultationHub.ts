import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { coreScheduleService, reservationService } from '@/core/schedules';
import { customerJoinService } from '@/core/customer/services/customerJoinService';
import {
  consumeOpenConsultationInquiries,
  consumeOpenConsultationReservations,
} from '@/core/customer/studentJoinInbox';
import { useStaffGrants, useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import type { CustomerJoinRequest, ReservationDetail } from '@/types';
import { inquiryBelongsToStaff, reservationBelongsToStaff } from './staffConsultationScope';

export type ConsultationSegment =
  | 'home'
  | 'reservations'
  | 'joins'
  | 'inquiries'
  | 'records'
  | 'availability';

export const CONSULTATION_OPTIONS: { value: ConsultationSegment; label: string }[] = [
  { value: 'home', label: '오늘' },
  { value: 'reservations', label: '예약' },
  { value: 'joins', label: '가입' },
  { value: 'inquiries', label: '문의' },
  { value: 'records', label: '기록' },
  { value: 'availability', label: '가능시간' },
];

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameLocalDay(iso: string, key: string): boolean {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}` === key;
}

export function formatConsultationTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function consultationStatusLabel(status: string): { label: string; className: string } {
  if (status === 'confirmed') {
    return { label: '확정', className: 'bg-emerald-50 text-emerald-700' };
  }
  if (status === 'cancelled') {
    return { label: '취소', className: 'bg-slate-100 text-slate-500' };
  }
  return { label: '대기', className: 'bg-amber-50 text-amber-700' };
}

export function usePianoConsultationHub() {
  const { showToast } = useApp();
  const { currentOrganization } = useOrganization();
  const { isScoped, staffId, scopeStudents } = useStaffScope();
  const { allow } = useStaffGrants();
  const canJoin = allow('joinApproval');
  const canAvailability = allow('consultationAvailability');
  const assignedStudents = useMemo(
    () => scopeStudents(StorageService.getStudents()),
    [scopeStudents]
  );
  const [myScheduleIds, setMyScheduleIds] = useState<Set<string>>(new Set());
  const [segment, setSegment] = useState<ConsultationSegment>('home');
  const [todayRows, setTodayRows] = useState<ReservationDetail[]>([]);
  const [loadingToday, setLoadingToday] = useState(false);
  const [pendingInquiryCount, setPendingInquiryCount] = useState(0);

  const options = useMemo(
    () =>
      CONSULTATION_OPTIONS.filter((option) => {
        if (option.value === 'joins' && !canJoin) return false;
        if (option.value === 'availability' && !canAvailability) return false;
        return true;
      }),
    [canJoin, canAvailability]
  );

  const keepReservation = useCallback(
    (row: ReservationDetail) => {
      if (!isScoped || !staffId) return true;
      return reservationBelongsToStaff(row, staffId, assignedStudents, myScheduleIds);
    },
    [isScoped, staffId, assignedStudents, myScheduleIds]
  );

  const keepInquiry = useCallback(
    (row: CustomerJoinRequest) => {
      if (!isScoped || !staffId) return true;
      return inquiryBelongsToStaff(row, staffId, assignedStudents);
    },
    [isScoped, staffId, assignedStudents]
  );

  useEffect(() => {
    if (consumeOpenConsultationReservations()) setSegment('reservations');
    else if (consumeOpenConsultationInquiries()) setSegment('inquiries');
  }, []);

  useEffect(() => {
    if (segment === 'joins' && !canJoin) setSegment('home');
    if (segment === 'availability' && !canAvailability) setSegment('home');
  }, [segment, canJoin, canAvailability]);

  useEffect(() => {
    if (!isScoped || !staffId || !currentOrganization) return;
    let cancelled = false;
    coreScheduleService
      .getOrganizationSchedules(currentOrganization.id)
      .then((rows) => {
        if (cancelled) return;
        setMyScheduleIds(new Set(rows.filter((row) => row.staff_id === staffId).map((row) => row.id)));
      })
      .catch(() => {
        if (!cancelled) setMyScheduleIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [isScoped, staffId, currentOrganization]);

  const loadToday = useCallback(async () => {
    if (!currentOrganization) return;
    setLoadingToday(true);
    try {
      const all = await reservationService.getOrganizationReservations(currentOrganization.id);
      const key = todayKey();
      setTodayRows(
        all
          .filter((r) => r.status !== 'cancelled' && isSameLocalDay(r.schedule_starts_at, key))
          .filter(keepReservation)
          .sort((a, b) => a.schedule_starts_at.localeCompare(b.schedule_starts_at))
      );
    } catch (err) {
      console.error(err);
      setTodayRows([]);
      if (!isScoped) showToast('오늘 상담을 불러오지 못했습니다.', 'error');
    } finally {
      setLoadingToday(false);
    }
  }, [currentOrganization, showToast, isScoped, keepReservation]);

  useEffect(() => {
    if (segment === 'home') void loadToday();
  }, [segment, loadToday]);

  useEffect(() => {
    if (!currentOrganization?.id) return;
    let cancelled = false;
    customerJoinService
      .getOrgJoinRequests(currentOrganization.id, 'pending', 'consultation')
      .then((rows) => {
        if (cancelled) return;
        const visible = isScoped ? rows.filter(keepInquiry) : rows;
        setPendingInquiryCount(visible.length);
      })
      .catch(() => {
        if (!cancelled) setPendingInquiryCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [currentOrganization?.id, segment, isScoped, keepInquiry]);

  const pendingToday = todayRows.filter((r) => r.status === 'requested').length;

  return {
    currentOrganization,
    isScoped,
    canJoin,
    canAvailability,
    segment,
    setSegment,
    options,
    todayRows,
    loadingToday,
    pendingInquiryCount,
    pendingToday,
    keepReservation,
    keepInquiry,
    loadToday,
  };
}
