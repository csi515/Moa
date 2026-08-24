import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks/useStorageRefresh';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { OrganizationPublicCodeEditor } from '@/core/organizations/components/OrganizationPublicCodeEditor';
import { StorageService } from '@/services/storage';
import { getStorageAdapter } from '@/services/adapters';
import { PageHeader, FilterTabs, EmptyState, type FilterTabItem } from '@/shared/components';
import { MessageSquarePlus, RefreshCw } from 'lucide-react';
import {
  CONSULTATION_REQUEST_STATUS_LABELS,
  type ConsultationBookingRequest,
  type ConsultationRequestStatus,
} from '../types';
import { ConsultationBookingSettingsPanel } from './ConsultationBookingSettingsPanel';
import { ConsultationQrPrintCard, ConsultationRequestCard } from './ConsultationQrPrintCard';

type AdminTab = 'requests' | 'settings' | 'qr';

const STATUS_STYLES: Record<ConsultationRequestStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-600',
};

const ADMIN_TABS: FilterTabItem<AdminTab>[] = [
  { id: 'requests', label: '신청 목록' },
  { id: 'settings', label: '시간 설정' },
  { id: 'qr', label: 'QR 인쇄' },
];

/** 사장용 상담 예약 관리 (코어) */
export const ConsultationBookingAdminView: React.FC = () => {
  const { showToast, triggerRefresh } = useApp();
  const refreshKey = useStorageRefresh();
  const { currentOrganization, refreshOrganizations } = useOrganization();
  const [refreshing, setRefreshing] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('requests');
  const [statusFilter, setStatusFilter] = useState<ConsultationRequestStatus | 'all'>('all');
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
    if (!currentOrganization?.id || adminTab !== 'requests') return;
    setRefreshing(true);
    getStorageAdapter()
      .hydrate(currentOrganization.id, currentOrganization.industry_type)
      .finally(() => setRefreshing(false));
  }, [currentOrganization?.id, adminTab, currentOrganization?.industry_type]);

  const handleRefresh = async () => {
    if (!currentOrganization?.id) return;
    setRefreshing(true);
    await getStorageAdapter().hydrate(currentOrganization.id, currentOrganization.industry_type);
    setRefreshing(false);
    triggerRefresh();
    showToast('상담 신청 목록을 새로고침했습니다.', 'info');
  };

  const handleSaveSettings = (next: typeof settings) => {
    StorageService.saveConsultationBookingSettings(next);
    showToast('상담 예약 설정이 저장되었습니다.', 'success');
    triggerRefresh();
  };

  const handleStatusChange = (req: ConsultationBookingRequest, status: ConsultationRequestStatus) => {
    StorageService.updateConsultationBookingRequestStatus(
      req.id,
      status,
      memoDrafts[req.id] ?? req.adminMemo
    );
    showToast(`상태가 "${CONSULTATION_REQUEST_STATUS_LABELS[status]}"(으)로 변경되었습니다.`, 'success');
    triggerRefresh();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<MessageSquarePlus className="w-6 h-6" />}
        title={pendingCount > 0 ? `상담 예약 (신규 ${pendingCount})` : '상담 예약'}
        description="QR로 고객 상담 신청을 받고, 가능한 시간을 설정하세요."
        actions={
          adminTab === 'requests' ? (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          ) : undefined
        }
      />

      <FilterTabs tabs={ADMIN_TABS} active={adminTab} onChange={setAdminTab} />

      {adminTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`min-h-[44px] px-3 rounded-xl text-xs font-bold ${
                  statusFilter === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {key === 'all' ? '전체' : CONSULTATION_REQUEST_STATUS_LABELS[key]}
              </button>
            ))}
          </div>

          {filteredRequests.length === 0 ? (
            <EmptyState
              title="상담 신청이 없습니다"
              description="QR 포스터를 문에 붙이면 고객이 직접 상담을 예약할 수 있습니다."
            />
          ) : (
            <div className="grid gap-3">
              {filteredRequests.map((req) => (
                <ConsultationRequestCard
                  key={req.id}
                  name={req.name}
                  phone={req.phone}
                  content={req.content}
                  preferredDate={req.preferredDate}
                  preferredTime={req.preferredTime}
                  statusLabel={CONSULTATION_REQUEST_STATUS_LABELS[req.status]}
                  statusClassName={STATUS_STYLES[req.status]}
                  adminMemo={req.adminMemo}
                  actions={
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <textarea
                        value={memoDrafts[req.id] ?? req.adminMemo ?? ''}
                        onChange={(e) =>
                          setMemoDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="연락 메모 (선택)"
                        rows={2}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                      />
                      <div className="flex flex-wrap gap-2">
                        {req.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(req, 'confirmed')}
                            className="min-h-[44px] px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                          >
                            확정
                          </button>
                        )}
                        {req.status !== 'completed' && req.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(req, 'completed')}
                            className="min-h-[44px] px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                          >
                            상담 완료
                          </button>
                        )}
                        {req.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(req, 'cancelled')}
                            className="min-h-[44px] px-3 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            취소
                          </button>
                        )}
                      </div>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {adminTab === 'settings' && (
        <ConsultationBookingSettingsPanel settings={settings} onSave={handleSaveSettings} />
      )}

      {adminTab === 'qr' && currentOrganization && (
        <div className="space-y-4">
          <OrganizationPublicCodeEditor
            organizationId={currentOrganization.id}
            publicCode={currentOrganization.public_code}
            onUpdated={async () => {
              await refreshOrganizations();
              showToast('업체 코드가 변경되었습니다. QR을 다시 인쇄해 주세요.', 'success');
            }}
          />
          <ConsultationQrPrintCard
            publicCode={currentOrganization.public_code}
            enabled={settings.enabled}
          />
        </div>
      )}
    </div>
  );
};
