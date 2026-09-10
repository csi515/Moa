import React, { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { useApp } from '@/context/AppContext';
import {
  getOrgEnrollmentRequests,
  approveEnrollmentRequest,
  rejectEnrollmentRequest,
  type GuardianEnrollmentRequest,
} from '@/core/parent/services/enrollmentRequestService';
import { GuardianEnrollmentRequestCard } from './GuardianEnrollmentRequestCard';

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
      <div id="guardian-enrollment-inbox" className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div id="guardian-enrollment-inbox" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">학부모 등록</h2>
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
            대기중
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
            {filter === 'pending' && '대기중인 등록 요청이 없습니다'}
            {filter === 'approved' && '승인된 등록 요청이 없습니다'}
            {filter === 'rejected' && '거절된 등록 요청이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <GuardianEnrollmentRequestCard
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
