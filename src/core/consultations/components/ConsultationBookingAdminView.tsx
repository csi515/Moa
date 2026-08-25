import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { PageHeader, FilterTabs } from '@/shared/components';
import { MessageSquarePlus, RefreshCw } from 'lucide-react';
import { CONSULTATION_ADMIN_TABS, type ConsultationAdminTab } from '../constants';
import { useConsultationBookingAdmin } from '../hooks/useConsultationBookingAdmin';
import { ConsultationBookingRequestsPanel } from './ConsultationBookingRequestsPanel';
import { ConsultationBookingSettingsPanel } from './ConsultationBookingSettingsPanel';
import { ConsultationBookingQrPanel } from './ConsultationBookingQrPanel';

/** 사장용 상담 예약 관리 (코어) */
export const ConsultationBookingAdminView: React.FC = () => {
  const { showToast } = useApp();
  const { currentOrganization, refreshOrganizations } = useOrganization();
  const [adminTab, setAdminTab] = useState<ConsultationAdminTab>('requests');

  const {
    settings,
    requests,
    pendingCount,
    refreshing,
    statusFilter,
    setStatusFilter,
    memoDrafts,
    setMemoDraft,
    refresh,
    saveSettings,
    updateStatus,
  } = useConsultationBookingAdmin(
    currentOrganization?.id,
    currentOrganization?.industry_type,
    adminTab === 'requests'
  );

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
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>
          ) : undefined
        }
      />

      <FilterTabs tabs={CONSULTATION_ADMIN_TABS} active={adminTab} onChange={setAdminTab} />

      {adminTab === 'requests' && (
        <ConsultationBookingRequestsPanel
          requests={requests}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          memoDrafts={memoDrafts}
          onMemoChange={setMemoDraft}
          onStatusChange={updateStatus}
        />
      )}

      {adminTab === 'settings' && (
        <ConsultationBookingSettingsPanel settings={settings} onSave={saveSettings} />
      )}

      {adminTab === 'qr' && currentOrganization && (
        <ConsultationBookingQrPanel
          organizationId={currentOrganization.id}
          publicCode={currentOrganization.public_code}
          bookingEnabled={settings.enabled}
          onPublicCodeUpdated={async () => {
            await refreshOrganizations();
            showToast('업체 코드가 변경되었습니다. QR을 다시 인쇄해 주세요.', 'success');
          }}
        />
      )}
    </div>
  );
};
