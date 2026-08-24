import React from 'react';
import { CalendarDays, CheckCircle2, Clock, Loader2, Phone, User } from 'lucide-react';
import { getPublicConsultationBookingErrorMessage } from '../constants';
import { usePublicConsultationBooking } from '../hooks/usePublicConsultationBooking';

/** QR 공개 상담 예약 페이지 (비로그인) */
export const PublicConsultationBookingPage: React.FC = () => {
  const {
    loading,
    context,
    errorKey,
    submitted,
    submitting,
    name,
    setName,
    phone,
    setPhone,
    content,
    setContent,
    preferredDate,
    setPreferredDate,
    preferredTime,
    setPreferredTime,
    selectableDates,
    availableTimes,
    submit,
  } = usePublicConsultationBooking();

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
          {getPublicConsultationBookingErrorMessage(errorKey)}
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
            {getPublicConsultationBookingErrorMessage(errorKey)}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-sm"
        >
          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              이름
            </span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="홍길동"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              연락처
            </span>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="010-1234-5678"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1">상담 내용</span>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="상담하고 싶은 내용을 적어 주세요"
            />
          </label>

          <label className="block">
            <span className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              희망 날짜
            </span>
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
          </label>

          <div>
            <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              희망 시간
            </p>
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
