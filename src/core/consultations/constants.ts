import type { FilterTabItem } from '@/shared/components';
import type { ConsultationRequestStatus } from './types';
import { CONSULTATION_REQUEST_STATUS_LABELS } from './types';

export type ConsultationAdminTab = 'requests' | 'settings' | 'qr';

export const CONSULTATION_ADMIN_TABS: FilterTabItem<ConsultationAdminTab>[] = [
  { id: 'requests', label: '신청 목록' },
  { id: 'settings', label: '시간 설정' },
  { id: 'qr', label: 'QR 인쇄' },
];

export const CONSULTATION_STATUS_STYLES: Record<ConsultationRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

export const CONSULTATION_STATUS_FILTER_KEYS = [
  'all',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export type ConsultationStatusFilter = (typeof CONSULTATION_STATUS_FILTER_KEYS)[number];

export function getConsultationStatusFilterLabel(key: ConsultationStatusFilter): string {
  if (key === 'all') return '전체';
  return CONSULTATION_REQUEST_STATUS_LABELS[key];
}

export const PUBLIC_CONSULTATION_BOOKING_ERROR_MESSAGES: Record<string, string> = {
  not_found: '예약 페이지를 찾을 수 없습니다.',
  disabled: '현재 상담 예약을 받지 않습니다.',
  load_failed: '정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  slot_taken: '선택하신 시간은 이미 예약되었습니다. 다른 시간을 선택해 주세요.',
  past_date: '과거 날짜는 선택할 수 없습니다.',
  invalid_input: '입력 정보를 확인해 주세요.',
  submit_failed: '예약 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.',
};

export function getPublicConsultationBookingErrorMessage(errorKey: string): string {
  return PUBLIC_CONSULTATION_BOOKING_ERROR_MESSAGES[errorKey] ?? errorKey;
}
