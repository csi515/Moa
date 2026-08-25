import React from 'react';
import { EmptyState } from '@/shared/components';
import {
  CONSULTATION_REQUEST_STATUS_LABELS,
  type ConsultationBookingRequest,
  type ConsultationRequestStatus,
} from '../types';
import {
  CONSULTATION_STATUS_FILTER_KEYS,
  CONSULTATION_STATUS_STYLES,
  getConsultationStatusFilterLabel,
  type ConsultationStatusFilter,
} from '../constants';
import { ConsultationRequestCard } from './ConsultationRequestCard';

interface Props {
  requests: ConsultationBookingRequest[];
  statusFilter: ConsultationStatusFilter;
  onStatusFilterChange: (filter: ConsultationStatusFilter) => void;
  memoDrafts: Record<string, string>;
  onMemoChange: (id: string, value: string) => void;
  onStatusChange: (req: ConsultationBookingRequest, status: ConsultationRequestStatus) => void;
}

/** 상담 신청 목록 패널 */
export const ConsultationBookingRequestsPanel: React.FC<Props> = ({
  requests,
  statusFilter,
  onStatusFilterChange,
  memoDrafts,
  onMemoChange,
  onStatusChange,
}) => (
  <div className="space-y-4">
    <div className="flex flex-wrap gap-2">
      {CONSULTATION_STATUS_FILTER_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onStatusFilterChange(key)}
          className={`min-h-[44px] px-3 rounded-xl text-xs font-bold ${
            statusFilter === key
              ? 'bg-indigo-600 text-white'
              : 'bg-white border border-slate-200 text-slate-600'
          }`}
        >
          {getConsultationStatusFilterLabel(key)}
        </button>
      ))}
    </div>

    {requests.length === 0 ? (
      <EmptyState
        title="상담 신청이 없습니다"
        description="QR 포스터를 문에 붙이면 고객이 직접 상담을 예약할 수 있습니다."
      />
    ) : (
      <div className="grid gap-3">
        {requests.map((req) => (
          <ConsultationRequestCard
            key={req.id}
            name={req.name}
            phone={req.phone}
            content={req.content}
            preferredDate={req.preferredDate}
            preferredTime={req.preferredTime}
            statusLabel={CONSULTATION_REQUEST_STATUS_LABELS[req.status]}
            statusClassName={CONSULTATION_STATUS_STYLES[req.status]}
            adminMemo={req.adminMemo}
            actions={
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <textarea
                  value={memoDrafts[req.id] ?? req.adminMemo ?? ''}
                  onChange={(e) => onMemoChange(req.id, e.target.value)}
                  placeholder="연락 메모 (선택)"
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  {req.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(req, 'confirmed')}
                      className="min-h-[44px] px-3 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                    >
                      확정
                    </button>
                  )}
                  {req.status !== 'completed' && req.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(req, 'completed')}
                      className="min-h-[44px] px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                    >
                      상담 완료
                    </button>
                  )}
                  {req.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(req, 'cancelled')}
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
);
