import React, { useState } from 'react';
import { ChevronRight, Users, Building2, Plus, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useParentPortal } from '@/core/parent/context/ParentPortalContext';
import { GUARDIAN_RELATIONSHIP_LABELS } from '@/core/parent/types';
import {
  ACTIVE_ENROLLMENT_STATUSES,
  INACTIVE_ENROLLMENT_STATUSES,
  ENROLLMENT_REQUEST_STATUS_LABELS,
  type GlobalStudent,
  type EnrollmentRequestInfo,
} from '@/core/parent/types/globalParent';
import { ParentRequestEnrollmentModal } from './ParentRequestEnrollmentModal';
import { ParentChildSelectorModal } from './ParentChildSelectorModal';
import { ParentEnrollmentConsentModal } from './ParentEnrollmentConsentModal';
import { requestEnrollment, cancelEnrollmentRequest, type OrganizationSearchResult } from '@/core/parent/services/enrollmentRequestService';
import { useApp } from '@/context/AppContext';

export const ParentChildrenHome: React.FC = () => {
  const { portalTree, selectStudent, refreshPortalTree } = useParentPortal();
  const { showToast } = useApp();
  const children = portalTree?.children ?? [];
  const requests = portalTree?.enrollmentRequests ?? [];

  const [showOrgSearch, setShowOrgSearch] = useState(false);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationSearchResult | null>(null);
  const [selectedChild, setSelectedChild] = useState<GlobalStudent | null>(null);

  const handleOrgSelect = (org: OrganizationSearchResult) => {
    setSelectedOrg(org);
    setShowOrgSearch(false);
    setShowChildSelector(true);
  };

  const handleChildSelect = (child: GlobalStudent) => {
    setSelectedChild(child);
    setShowConsent(true);
  };

  const handleConfirmRequest = async (consentFields: string[], notes?: string) => {
    if (!selectedOrg || !selectedChild) return;

    try {
      const result = await requestEnrollment({
        studentId: selectedChild.studentId,
        organizationId: selectedOrg.id,
        consentFields,
        notes,
      });

      showToast(`${result.organizationName}에 ${result.studentName} 등록을 요청했습니다`, 'success');
      setShowConsent(false);
      setSelectedOrg(null);
      setSelectedChild(null);
      await refreshPortalTree();
    } catch (err) {
      throw err;
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelEnrollmentRequest(requestId);
      showToast('등록 요청을 취소했습니다', 'success');
      await refreshPortalTree();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '요청 취소에 실패했습니다', 'error');
    }
  };

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-slate-200 shadow-sm">
        <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">연결된 자녀가 없습니다</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          학원에서 발급한 8자리 연결 코드를 입력하거나<br />
          내 자녀를 직접 등록해 주세요
        </p>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-left">
          <p className="text-xs font-bold text-indigo-900 mb-2">💡 연결 방법</p>
          <ul className="text-xs text-indigo-700 space-y-1">
            <li>• 학원에 연결 코드를 요청하세요</li>
            <li>• 위의 '코드 입력하기' 버튼을 눌러 코드를 입력합니다</li>
            <li>• QR 코드가 있다면 QR 버튼으로 스캔할 수 있습니다</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">내 자녀</p>
          <button
            type="button"
            onClick={() => setShowOrgSearch(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            학원 등록 요청
          </button>
        </div>

        <div className="space-y-3">
          {children.map((child) => (
            <ChildCard key={child.studentId} child={child} onSelect={() => selectStudent(child)} />
          ))}
        </div>

        {requests.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">등록 요청 현황</p>
            <div className="space-y-2">
              {requests.map((request) => (
                <EnrollmentRequestCard
                  key={request.id}
                  request={request}
                  onCancel={() => void handleCancelRequest(request.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <ParentRequestEnrollmentModal
        isOpen={showOrgSearch}
        onClose={() => setShowOrgSearch(false)}
        onSelectOrg={handleOrgSelect}
      />

      <ParentChildSelectorModal
        isOpen={showChildSelector}
        onClose={() => {
          setShowChildSelector(false);
          setSelectedOrg(null);
        }}
        children={children}
        onSelect={handleChildSelect}
        title="등록할 자녀 선택"
      />

      {selectedOrg && selectedChild && (
        <ParentEnrollmentConsentModal
          isOpen={showConsent}
          onClose={() => {
            setShowConsent(false);
            setSelectedOrg(null);
            setSelectedChild(null);
          }}
          organization={selectedOrg}
          student={selectedChild}
          onConfirm={handleConfirmRequest}
        />
      )}
    </>
  );
};

const ChildCard: React.FC<{ child: GlobalStudent; onSelect: () => void }> = ({ child, onSelect }) => {
  const academyCount = child.enrollments.length;
  const activeCount = child.enrollments.filter((e) =>
    ACTIVE_ENROLLMENT_STATUSES.includes(e.status)
  ).length;
  const inactiveCount = child.enrollments.filter((e) =>
    INACTIVE_ENROLLMENT_STATUSES.includes(e.status)
  ).length;
  const unlinked = academyCount === 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left min-h-[44px]"
    >
      <div className="min-w-0">
        <p className="font-black text-slate-900 truncate">{child.displayName}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {GUARDIAN_RELATIONSHIP_LABELS[child.relationship]}
          {child.isPrimary && ' · 대표 보호자'}
        </p>
        <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {unlinked
            ? '학원 미연결 · 코드로 연결 가능'
            : academyCount > 0
              ? `학원 ${activeCount}/${academyCount}${inactiveCount > 0 ? ` · 기록 ${inactiveCount}` : ''}`
              : '등록 학원 없음'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
    </button>
  );
};

const EnrollmentRequestCard: React.FC<{
  request: EnrollmentRequestInfo;
  onCancel: () => void;
}> = ({ request, onCancel }) => {
  const statusIcon = {
    pending: <Clock className="w-4 h-4 text-amber-600" />,
    approved: <CheckCircle className="w-4 h-4 text-green-600" />,
    rejected: <XCircle className="w-4 h-4 text-rose-600" />,
    cancelled: <Ban className="w-4 h-4 text-slate-400" />,
  }[request.status];

  const statusColor = {
    pending: 'bg-amber-50 border-amber-200 text-amber-900',
    approved: 'bg-green-50 border-green-200 text-green-900',
    rejected: 'bg-rose-50 border-rose-200 text-rose-900',
    cancelled: 'bg-slate-50 border-slate-200 text-slate-600',
  }[request.status];

  return (
    <div className={`p-4 rounded-xl border ${statusColor}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {statusIcon}
            <p className="text-xs font-bold uppercase">
              {ENROLLMENT_REQUEST_STATUS_LABELS[request.status]}
            </p>
          </div>
          <p className="font-bold text-sm truncate">{request.organizationName}</p>
          <p className="text-xs mt-0.5">자녀: {request.studentName}</p>
          <p className="text-xs text-slate-500 mt-1">
            요청일: {new Date(request.requestedAt).toLocaleDateString('ko-KR')}
          </p>
          {request.rejectionReason && (
            <p className="text-xs mt-2 p-2 bg-white/50 rounded">
              거절 사유: {request.rejectionReason}
            </p>
          )}
        </div>
        {request.status === 'pending' && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white rounded-lg hover:bg-slate-100 transition-colors shrink-0"
          >
            취소
          </button>
        )}
      </div>
    </div>
  );
};
