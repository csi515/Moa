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
      showToast(err instanceof Error ? err.message : '?붿껌 紐⑸줉??遺덈윭?ㅼ? 紐삵뻽?듬땲??, 'error');
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
      showToast('?깅줉 ?붿껌???뱀씤?덉뒿?덈떎', 'success');
      await loadRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '?뱀씤???ㅽ뙣?덉뒿?덈떎', 'error');
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      await rejectEnrollmentRequest(requestId, reason);
      showToast('?깅줉 ?붿껌??嫄곗젅?덉뒿?덈떎', 'success');
      await loadRequests();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '嫄곗젅 泥섎━???ㅽ뙣?덉뒿?덈떎', 'error');
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
        <h2 className="text-xl font-bold text-slate-900">?숇?紐??깅줉</h2>
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
            ?湲?以?
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
            ?뱀씤??
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
            嫄곗젅??
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">
            {filter === 'pending' && '?湲?以묒씤 ?깅줉 ?붿껌???놁뒿?덈떎'}
            {filter === 'approved' && '?뱀씤???깅줉 ?붿껌???놁뒿?덈떎'}
            {filter === 'rejected' && '嫄곗젅???깅줉 ?붿껌???놁뒿?덈떎'}
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
