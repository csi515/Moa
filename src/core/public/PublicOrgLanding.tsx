import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  ArrowLeft,
  QrCode,
  Calendar,
  Users,
  ChevronRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import type { PublicOrgInfo, ConsultationSubmission, BookableSchedule, ReservationRequest } from '@/types';
import { publicOrgService } from './services/publicOrgService';
import { coreScheduleService, reservationService } from '@/core/schedules';
import { supabase } from '@/lib/supabase/client';
import { appBrand } from '@/core/brand';
import { getIndustryLabel } from '@/core/industry/types';

interface PublicOrgLandingProps {
  code: string;
}

export function PublicOrgLanding({ code }: PublicOrgLandingProps) {
  const navigate = useNavigate();
  const [org, setOrg] = useState<PublicOrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [consultSubmitted, setConsultSubmitted] = useState(false);
  const [consultForm, setConsultForm] = useState<ConsultationSubmission>({
    contact_name: '',
    contact_phone: '',
    message: '',
    preferred_time: '',
  });

  // Booking related states
  const [bookableSchedules, setBookableSchedules] = useState<BookableSchedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<BookableSchedule | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [bookingForm, setBookingForm] = useState<Omit<ReservationRequest, 'schedule_id'>>({
    applicant_name: '',
    applicant_phone: '',
    applicant_email: '',
    request_message: '',
  });

  useEffect(() => {
    async function fetchOrg() {
      try {
        setLoading(true);
        setError(null);
        const data = await publicOrgService.getOrganizationByCode(code);
        if (!data) {
          setError('조직을 찾을 수 없습니다');
        } else {
          setOrg(data);
          // Load bookable schedules
          loadBookableSchedules(data.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '조직 정보를 가져오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    }

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    }

    fetchOrg();
    checkAuth();
  }, [code]);

  const loadBookableSchedules = async (orgId: string) => {
    try {
      setLoadingSchedules(true);
      const schedules = await coreScheduleService.listBookableSchedules(orgId);
      setBookableSchedules(schedules);
    } catch (err) {
      console.error('Failed to load bookable schedules:', err);
      // Silent fail - bookable schedules are optional
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleJoinRequest = () => {
    // Navigate to customer sign up flow with pre-selected org
    navigate('/signup/customer', { state: { selectedOrgId: org?.id } });
  };

  const handleConsultSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!org) return;

    try {
      await publicOrgService.submitConsultation(org.id, consultForm);
      setConsultSubmitted(true);
      setConsultForm({
        contact_name: '',
        contact_phone: '',
        message: '',
        preferred_time: '',
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '상담 신청에 실패했습니다');
    }
  };

  const handleOpenBookingForm = (schedule: BookableSchedule) => {
    if (!isAuthenticated) {
      // Redirect to login/signup
      alert('예약하려면 로그인이 필요합니다.');
      navigate('/login', { state: { redirectTo: `/c/${code}` } });
      return;
    }
    setSelectedSchedule(schedule);
    setBookingForm({
      applicant_name: '',
      applicant_phone: '',
      applicant_email: '',
      request_message: '',
    });
    setShowBookingForm(true);
    setBookingSubmitted(false);
  };

  const handleBookingSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedSchedule) return;

    try {
      await reservationService.requestReservation({
        schedule_id: selectedSchedule.id,
        ...bookingForm,
      });
      setBookingSubmitted(true);
    } catch (err: any) {
      const errorMsg = err?.message || '예약 신청에 실패했습니다';
      alert(errorMsg);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-slate-600">조직 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">조직을 찾을 수 없습니다</h2>
          <p className="text-slate-600 mb-6">{error || '입력하신 코드가 올바르지 않습니다'}</p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const currentUrl = window.location.origin + `/c/${org.public_code}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">뒤로 가기</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-slate-900">{appBrand.shortName}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Organization Info Card */}
        <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{org.name}</h1>
              <p className="text-sm text-slate-600 inline-flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  {getIndustryLabel(org.industry_type)}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-mono">
                  {org.public_code}
                </span>
              </p>
            </div>
          </div>

          {org.description && (
            <p className="text-slate-700 mb-6 leading-relaxed">{org.description}</p>
          )}

          <dl className="space-y-3">
            {org.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm font-medium text-slate-500">주소</dt>
                  <dd className="text-slate-900">{org.address}</dd>
                </div>
              </div>
            )}
            {org.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm font-medium text-slate-500">전화</dt>
                  <dd className="text-slate-900">
                    <a href={`tel:${org.phone}`} className="hover:text-indigo-600 transition-colors">
                      {org.phone}
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {org.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm font-medium text-slate-500">이메일</dt>
                  <dd className="text-slate-900">
                    <a href={`mailto:${org.email}`} className="hover:text-indigo-600 transition-colors">
                      {org.email}
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {org.business_hours && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <dt className="text-sm font-medium text-slate-500">운영 시간</dt>
                  <dd className="text-slate-900 whitespace-pre-line">{org.business_hours}</dd>
                </div>
              </div>
            )}
          </dl>
        </section>

        {/* Action Buttons */}
        <section className="space-y-3">
          <button
            onClick={handleJoinRequest}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
          >
            <CheckCircle2 className="w-6 h-6" />
            회원 가입 신청
          </button>
          <button
            onClick={() => {
              setShowConsultForm(true);
              setConsultSubmitted(false);
            }}
            className="w-full py-4 bg-white text-indigo-600 border-2 border-indigo-600 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-6 h-6" />
            무료 상담 예약
          </button>
        </section>

        {/* Bookable Schedules */}
        {bookableSchedules.length > 0 && (
          <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-indigo-600" />
              예약 가능한 일정
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              원하시는 시간대를 선택하여 예약하세요
            </p>
            
            {loadingSchedules ? (
              <div className="text-center py-8">
                <div className="inline-block w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-2 text-sm text-slate-600">일정을 불러오는 중...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookableSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 mb-1">{schedule.title}</h3>
                        {schedule.description && (
                          <p className="text-sm text-slate-600 mb-2">{schedule.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDateTime(schedule.starts_at)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>잔여 {schedule.available_slots}자리</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleOpenBookingForm(schedule)}
                        disabled={schedule.available_slots === 0}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-1 transition-colors ${
                          schedule.available_slots === 0
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        예약
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Consultation Form */}
        {showConsultForm && !consultSubmitted && (
          <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">상담 신청</h2>
            <p className="text-sm text-slate-600 mb-6">
              담당자가 확인 후 빠른 시일 내에 연락드리겠습니다
            </p>
            <form onSubmit={handleConsultSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={consultForm.contact_name}
                  onChange={(e) => setConsultForm({ ...consultForm, contact_name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={consultForm.contact_phone}
                  onChange={(e) => setConsultForm({ ...consultForm, contact_phone: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  희망 상담 시간 (선택)
                </label>
                <input
                  type="text"
                  value={consultForm.preferred_time}
                  onChange={(e) => setConsultForm({ ...consultForm, preferred_time: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="예: 평일 오후 2-4시"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  문의 내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={consultForm.message}
                  onChange={(e) => setConsultForm({ ...consultForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="궁금하신 사항을 자유롭게 작성해주세요"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowConsultForm(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                  상담 신청
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Consultation Success */}
        {consultSubmitted && (
          <section className="bg-green-50 border border-green-200 rounded-2xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">상담 신청이 완료되었습니다</h3>
            <p className="text-slate-700 mb-6">
              담당자가 확인 후 빠른 시일 내에 연락드리겠습니다
            </p>
            <button
              onClick={() => setShowConsultForm(false)}
              className="px-6 py-2 bg-white text-green-600 border border-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              닫기
            </button>
          </section>
        )}

        {/* Booking Modal */}
        {showBookingForm && selectedSchedule && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {bookingSubmitted ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">예약 신청이 완료되었습니다</h3>
                  <p className="text-slate-700 mb-2">
                    담당자가 확인 후 승인하면 확정됩니다
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    예약 현황은 내 예약 페이지에서 확인할 수 있습니다
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowBookingForm(false)}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      닫기
                    </button>
                    <button
                      onClick={() => navigate('/parent/bookings')}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      내 예약 보기
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="p-6 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-slate-900">예약 신청</h3>
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      ×
                    </button>
                  </div>

                  <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                    <h4 className="font-bold text-slate-900">{selectedSchedule.title}</h4>
                    <p className="text-sm text-slate-600">{formatDateTime(selectedSchedule.starts_at)}</p>
                    <p className="text-sm text-slate-600">잔여 {selectedSchedule.available_slots}자리</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={bookingForm.applicant_name}
                        onChange={(e) => setBookingForm({ ...bookingForm, applicant_name: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="이름을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        연락처 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.applicant_phone}
                        onChange={(e) => setBookingForm({ ...bookingForm, applicant_phone: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="010-0000-0000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        이메일 (선택)
                      </label>
                      <input
                        type="email"
                        value={bookingForm.applicant_email}
                        onChange={(e) => setBookingForm({ ...bookingForm, applicant_email: e.target.value })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="your@email.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        요청사항 (선택)
                      </label>
                      <textarea
                        value={bookingForm.request_message}
                        onChange={(e) => setBookingForm({ ...bookingForm, request_message: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="궁금한 사항이나 요청사항을 입력하세요"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                    >
                      예약 신청
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* QR Code Section */}
        <section className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
          <div className="text-center">
            <button
              onClick={() => setShowQR(!showQR)}
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <QrCode className="w-5 h-5" />
              {showQR ? 'QR 코드 숨기기' : 'QR 코드 보기'}
            </button>
            
            {showQR && (
              <div className="mt-6 inline-block p-4 bg-white rounded-2xl border-2 border-slate-200">
                <QRCodeSVG 
                  value={currentUrl} 
                  size={200} 
                  level="H"
                  includeMargin
                />
                <p className="text-xs text-slate-500 mt-3">
                  QR 코드를 스캔하여 접속하세요
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 py-4">
          <p>Powered by {appBrand.fullName}</p>
        </footer>
      </main>
    </div>
  );
}
