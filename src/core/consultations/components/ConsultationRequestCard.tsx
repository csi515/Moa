import React from 'react';
import { CalendarDays, Clock, Phone, User } from 'lucide-react';

interface Props {
  name: string;
  phone: string;
  content: string;
  preferredDate: string;
  preferredTime: string;
  statusLabel: string;
  statusClassName: string;
  adminMemo?: string;
  actions?: React.ReactNode;
}

/** 상담 신청 카드 (관리자 목록) */
export const ConsultationRequestCard: React.FC<Props> = ({
  name,
  phone,
  content,
  preferredDate,
  preferredTime,
  statusLabel,
  statusClassName,
  adminMemo,
  actions,
}) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div>
        <p className="font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          {name}
        </p>
        <a
          href={`tel:${phone}`}
          className="text-sm text-indigo-600 font-medium inline-flex items-center gap-1 mt-1 min-h-[44px]"
        >
          <Phone className="w-3.5 h-3.5" />
          {phone}
        </a>
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClassName}`}>
        {statusLabel}
      </span>
    </div>

    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" />
        {preferredDate}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock className="w-3.5 h-3.5" />
        {preferredTime}
      </span>
    </div>

    <p className="text-sm text-slate-700 whitespace-pre-wrap">{content}</p>

    {adminMemo && (
      <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2">메모: {adminMemo}</p>
    )}

    {actions}
  </article>
);
