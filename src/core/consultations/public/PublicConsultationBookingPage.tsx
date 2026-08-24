import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, Loader2, Phone, User } from 'lucide-react';
import { parsePublicBookingCode } from './bookingRouteConfig';
import {
  fetchPublicConsultationBookingContext,
  submitPublicConsultationBooking,
} from './publicConsultationBookingService';
import { getAvailableSlotsForDate, getSelectableDates } from '../slotUtils';
import type { PublicConsultationBookingContext } from '../types';

const ERROR_MESSAGES: Record<string, string> = {
  not_found: '예약 페이지를 찾을 수 없습니다.',
  disabled: '현재 상담 예약을 받지 않습니다.',
  load_failed: '정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
  slot_taken: '선택하신 시간은 이미 예약되었습니다. 다른 시간을 선택해 주세요.',
  past_date: '과거 날짜는 선택할 수 없습니다.',
  invalid_input: '입력 정보를 확인해 주세요.',
  submit_failed: '예약 접수에 실패했습니다. 잠시 후 다시 시도해 주세요.',
};

/** QR 공개 상담 예약 페이지 (비로그인) */
export const PublicConsultationBookingPage: React.FC = () => {
  const publicCode = parsePublicBookingCode();
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<PublicConsultationBookingContext | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  useEffect(() => {
    if (!publicCode) {
      setErrorKey('not_found');
      setLoading(false);
      return;
    }

    fetchPublicConsultationBookingContext(publicCode).then((result) => {
      if ('error' in result) {
        setErrorKey(result.error);
      } else {
        setContext(result);
        const dates = getSelectableDates(result.settings, result.bookedSlots);
        if (dates[0]) setPreferredDate(dates[0]);
      }
      setLoading(false);
    });
  }, [publicCode]);

  const selectableDates = useMemo(() => {
    if (!context) return [];
    return getSelectableDates(context.settings, context.bookedSlots);
  }, [context]);

  const availableTimes = useMemo(() => {
    if (!context || !preferredDate) return [];
    return getAvailableSlotsForDate(preferredDate, context.settings, context.bookedSlots);
  }, [context, preferredDate]);

  useEffect(() => {
    if (availableTimes.length > 0 && !availableTimes.includes(preferredTime)) {
      setPreferredTime(availableTimes[0]);
    } else if (availableTimes.length === 0) {
      setPreferredTime('');
    }
  }, [availableTimes, preferredTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicCode || !preferredDate || !preferredTime) return;

    setSubmitting(true);
    const result = await submitPublicConsultationBooking({
      publicCode,
      name,
      phone,
      content,
      preferredDate,
      preferredTime,
    });
    setSubmitting(false);

    if ('error' in result) {
      setErrorKey(result.error);
      return;
    }

    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (errorKey && !context) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-center text-slate-700 font-medium">
          {ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.load_failed}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-lg">
          <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
          <h1 className="text-xl font-black text-slate-900">상담 예약이 접수되었습니다</h1>
          <p className="text-sm text-slate-600">
            {context?.organizationName}에서 확인 후 연락드리겠습니다.
          </p>
          <p className="text-xs text-slate-500">
            {preferredDate} {preferredTime}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="max-w-lg mx-auto px-4 py-8 pb-16">
        <header className="text-center mb-8 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">상담 예약</p>
          <h1 className="text-2xl font-black text-slate-900">{context?.organizationName}</h1>
          <p className="text-sm text-slate-600">{context?.settings.welcomeMessage}</p>
        </header>

        {errorKey && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-3">
            {ERROR_MESSAGES[errorKey] ?? errorKey}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              이름
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="홍길동"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              연락처
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="010-1234-5678"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1">상담 내용</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="상담하고 싶은 내용을 적어 주세요"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              희망 날짜
            </label>
            <select
              required
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
            >
              {selectableDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              희망 시간
            </label>
            {availableTimes.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 rounded-xl p-3">
                선택 가능한 시간이 없습니다. 다른 날짜를 선택해 주세요.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setPreferredTime(time)}
                    className={`min-h-[44px] rounded-xl text-sm font-bold border ${
                      preferredTime === time
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !preferredTime}
            className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            상담 예약하기
          </button>
        </form>
      </div>
    </div>
  );
};
