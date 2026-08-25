import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks/useStorageRefresh';
import { StorageService } from '@/services/storage';
import { getStorageAdapter } from '@/services/adapters';
import {
  CONSULTATION_REQUEST_STATUS_LABELS,
  type ConsultationBookingRequest,
  type ConsultationBookingSettings,
  type ConsultationRequestStatus,
} from '../types';
import type { ConsultationStatusFilter } from '../constants';

async function syncConsultationBookingData(organizationId: string, industryType?: string | null) {
  await getStorageAdapter().hydrate(organizationId, industryType);
}

/** 사장용 상담 예약 관리 상태 */
export function useConsultationBookingAdmin(
  organizationId: string | undefined,
  industryType: string | null | undefined,
  syncOnRequestsTab = false
) {
  const { showToast, triggerRefresh } = useApp();
  const refreshKey = useStorageRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ConsultationStatusFilter>('all');
  const [memoDrafts, setMemoDrafts] = useState<Record<string, string>>({});

  const settings = StorageService.getConsultationBookingSettings();
  const requests = useMemo(
    () => StorageService.getConsultationBookingRequests(),
    [refreshKey]
  );

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  useEffect(() => {
    if (!organizationId || !syncOnRequestsTab) return;
    setRefreshing(true);
    syncConsultationBookingData(organizationId, industryType).finally(() => setRefreshing(false));
  }, [organizationId, industryType, syncOnRequestsTab]);

  const refresh = useCallback(async () => {
    if (!organizationId) return;
    setRefreshing(true);
    await syncConsultationBookingData(organizationId, industryType);
    setRefreshing(false);
    triggerRefresh();
    showToast('상담 신청 목록을 새로고침했습니다.', 'info');
  }, [organizationId, industryType, showToast, triggerRefresh]);

  const saveSettings = useCallback(
    (next: ConsultationBookingSettings) => {
      StorageService.saveConsultationBookingSettings(next);
      showToast('상담 예약 설정이 저장되었습니다.', 'success');
      triggerRefresh();
    },
    [showToast, triggerRefresh]
  );

  const updateStatus = useCallback(
    (req: ConsultationBookingRequest, status: ConsultationRequestStatus) => {
      StorageService.updateConsultationBookingRequestStatus(
        req.id,
        status,
        memoDrafts[req.id] ?? req.adminMemo
      );
      showToast(
        `상태가 "${CONSULTATION_REQUEST_STATUS_LABELS[status]}"(으)로 변경되었습니다.`,
        'success'
      );
      triggerRefresh();
    },
    [memoDrafts, showToast, triggerRefresh]
  );

  const setMemoDraft = useCallback((id: string, value: string) => {
    setMemoDrafts((prev) => ({ ...prev, [id]: value }));
  }, []);

  return {
    settings,
    requests: filteredRequests,
    pendingCount,
    refreshing,
    statusFilter,
    setStatusFilter,
    memoDrafts,
    setMemoDraft,
    refresh,
    saveSettings,
    updateStatus,
  };
}
