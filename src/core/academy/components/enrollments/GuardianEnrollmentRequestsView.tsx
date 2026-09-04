import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle, User, Phone, Mail, Calendar } from 'lucide-react';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { useApp } from '@/context/AppContext';
import {
  getOrgEnrollmentRequests,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
  type GuardianEnrollmentRequest,
} from '@/core/parent/services/enrollmentRequestService';
import { GUARDIAN_RELATIONSHIP_LABELS } from '@/core/parent/types';

export const GuardianEnrollmentRequestsView: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const { showToast } = useApp();
  const [requests, setRequests] = useState<GuardianEnrollmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const loadRequests = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const data = await getOrgEnrollmentRequests(currentOrganization.id, filter);
      setRequests(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '요청 목록을 불러오지 못했습니다', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, [currentOrganization?.id, filter]);

  const handleApprove = async (requestId: string) => {
    try {
      await approveEnrollmentRequest(requestId);
      showToast('등록 요청을 승인했습니다', 'success');
      await loadRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '승인에 실패했습니다', 'error');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await rejectEnrollmentRequest(requestId, reason);
      showToast('등록 요청을 거절했습니다', 'success');
      await loadRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '거절 처리에 실패했습니다', 'error');
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">학부모 등록 요청</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            대기 중
          </button>
          <button
            type="button"
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              filter === 'approved'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            승인됨
          </button>
          <button
            type="button"
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              filter === 'rejected'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            거절됨
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            {filter === 'pending' && '대기 중인 등록 요청이 없습니다'}
            {filter === 'approved' && '승인된 등록 요청이 없습니다'}
            {filter === 'rejected' && '거절된 등록 요청이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <EnrollmentRequestCard
              key={request.id}
              request={request}
              onApprove={() => void handleApprove(request.id)}
              onReject={(reason) => void handleReject(request.id, reason)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const EnrollmentRequestCard: React.FC<{
  request: GuardianEnrollmentRequest;
  onApprove: () => void;
  onReject: (reason: string) => void;
}> = ({ request, onApprove, onReject }) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    try {
      await onApprove();
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      return;
    }
    setProcessing(true);
    try {
      await onReject(rejectReason);
    } finally {
      setProcessing(false);
      setShowRejectForm(false);
      setRejectReason('');
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-lg text-slate-900 truncate">{request.studentName}</p>
              <p className="text-sm text-slate-500">
                {request.birthDate
                  ? new Date(request.birthDate).toLocaleDateString('ko-KR')
                  : '생년월일 미등록'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">보호자</p>
                <p className="font-bold text-slate-900">
                  {request.parentName} ({GUARDIAN_RELATIONSHIP_LABELS[request.relationship as keyof typeof GUARDIAN_RELATIONSHIP_LABELS]})
                </p>
              </div>
            </div>

            {request.parentPhone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">연락처</p>
                  <p className="font-bold text-slate-900">{request.parentPhone}</p>
                </div>
              </div>
            )}

            {request.parentEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">이메일</p>
                  <p className="font-bold text-slate-900 truncate">{request.parentEmail}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">요청일</p>
                <p className="font-bold text-slate-900">
                  {new Date(request.requestedAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>
          </div>

          {request.notes && (
            <div className="p-3 bg-slate-50 rounded-lg mb-3">
              <p className="text-xs font-bold text-slate-500 mb-1">전달 메시지</p>
              <p className="text-sm text-slate-700">{request.notes}</p>
            </div>
          )}

          {request.status === 'rejected' && request.rejectionReason && (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <p className="text-xs font-bold text-rose-900 mb-1">거절 사유</p>
              <p className="text-sm text-rose-800">{request.rejectionReason}</p>
            </div>
          )}

          {request.status === 'approved' && request.reviewedAt && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs font-bold text-green-900">
                ✓ {new Date(request.reviewedAt).toLocaleDateString('ko-KR')} 승인됨
                {request.reviewedByName && ` (${request.reviewedByName})`}
              </p>
            </div>
          )}
        </div>
      </div>

      {request.status === 'pending' && !showRejectForm && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowRejectForm(true)}
            disabled={processing}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            거절
          </button>
          <button
            type="button"
            onClick={() => void handleApprove()}
            disabled={processing}
            className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            승인
          </button>
        </div>
      )}

      {showRejectForm && (
        <div className="space-y-3">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="거절 사유를 입력해 주세요 (선택)"
            rows={3}
            maxLength={500}
            disabled={processing}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason('');
              }}
              disabled={processing}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl min-h-[44px] disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => void handleReject()}
              disabled={processing}
              className="flex-1 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              {processing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              거절 확정
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
