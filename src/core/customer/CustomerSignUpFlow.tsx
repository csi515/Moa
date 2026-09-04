import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  Building2, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import type { PublicOrgInfo, CustomerJoinRequest } from '@/types';
import { publicOrgService } from '@/core/public/services/publicOrgService';
import { customerJoinService } from '../services/customerJoinService';
import { useAuth } from '@/core/auth/AuthProvider';

type Step = 'search' | 'form' | 'pending';

function getIndustryLabel(industryType: string): string {
  const labels: Record<string, string> = {
    piano: '피아노학원',
    gym: '헬스/피트니스',
    daycare: '어린이집',
    pilates: '필라테스학원',
  };
  return labels[industryType] || industryType;
}

function getStatusLabel(status: string): { label: string; color: string } {
  const labels: Record<string, { label: string; color: string }> = {
    pending: { label: '승인 대기', color: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '승인 완료', color: 'bg-green-100 text-green-700' },
    rejected: { label: '반려됨', color: 'bg-red-100 text-red-700' },
    cancelled: { label: '취소됨', color: 'bg-slate-100 text-slate-700' },
  };
  return labels[status] || { label: status, color: 'bg-slate-100 text-slate-700' };
}

export function CustomerSignUpFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicOrgInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<PublicOrgInfo | null>(null);
  const [myRequests, setMyRequests] = useState<CustomerJoinRequest[]>([]);
  const [form, setForm] = useState({
    applicantName: user?.name || '',
    applicantPhone: '',
    applicantEmail: user?.email || '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // If pre-selected org from PublicOrgLanding
  useEffect(() => {
    const selectedOrgId = location.state?.selectedOrgId;
    if (selectedOrgId && step === 'search') {
      // Try to fetch the org and go to form step
      // For now, just proceed with search step
    }
  }, [location.state, step]);

  useEffect(() => {
    if (user && step === 'pending') {
      loadMyRequests();
    }
  }, [user, step]);

  const loadMyRequests = async () => {
    try {
      const requests = await customerJoinService.getMyJoinRequests();
      setMyRequests(requests);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const results = await publicOrgService.searchOrganizations(searchQuery);
      setSearchResults(results);
    } catch (err) {
      alert(err instanceof Error ? err.message : '검색에 실패했습니다');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectOrg = (org: PublicOrgInfo) => {
    setSelectedOrg(org);
    setStep('form');
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !user) return;

    try {
      setSubmitting(true);
      await customerJoinService.submitJoinRequest({
        orgId: selectedOrg.id,
        applicantName: form.applicantName,
        applicantPhone: form.applicantPhone,
        applicantEmail: form.applicantEmail,
        message: form.message,
      });
      setStep('pending');
      await loadMyRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : '가입 신청에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-slate-600 mb-6">가입 신청을 하려면 먼저 로그인해주세요</p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900">고객 가입 신청</h1>
            <button
              onClick={() => navigate('/')}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-1 rounded ${step === 'search' ? 'bg-indigo-600' : 'bg-indigo-200'}`} />
            <div className={`flex-1 h-1 rounded ${step === 'form' ? 'bg-indigo-600' : step === 'pending' ? 'bg-indigo-200' : 'bg-slate-200'}`} />
            <div className={`flex-1 h-1 rounded ${step === 'pending' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Search Organizations */}
        {step === 'search' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">학원 검색</h2>
              <p className="text-slate-600 mb-6">
                가입하고 싶은 학원을 검색하세요
              </p>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="학원 이름, 코드, 주소로 검색"
                    className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-lg"
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchQuery.trim()}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? '검색 중...' : '검색'}
                </button>
              </form>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  검색 결과 ({searchResults.length})
                </h3>
                {searchResults.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => handleSelectOrg(org)}
                    className="w-full bg-white rounded-xl border-2 border-slate-200 p-4 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 mb-1">{org.name}</h4>
                        <p className="text-sm text-slate-600 mb-2">
                          <span className="inline-flex items-center gap-1">
                            {getIndustryLabel(org.industry_type)}
                            <span className="text-slate-400">•</span>
                            <span className="font-mono">{org.public_code}</span>
                          </span>
                        </p>
                        {org.address && (
                          <p className="text-sm text-slate-500 flex items-start gap-1">
                            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{org.address}</span>
                          </p>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 self-center" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Join Request Form */}
        {step === 'form' && selectedOrg && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
              <button
                onClick={() => setStep('search')}
                className="text-indigo-600 hover:text-indigo-700 font-medium mb-4"
              >
                ← 다른 학원 검색
              </button>

              <div className="mb-6 pb-6 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{selectedOrg.name}</h3>
                <p className="text-sm text-slate-600">
                  {getIndustryLabel(selectedOrg.industry_type)} • {selectedOrg.public_code}
                </p>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mb-2">가입 신청서</h2>
              <p className="text-slate-600 mb-6">
                학원 담당자가 승인하면 알림을 보내드립니다
              </p>

              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.applicantName}
                    onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
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
                    value={form.applicantPhone}
                    onChange={(e) => setForm({ ...form, applicantPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="010-0000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={form.applicantEmail}
                    onChange={(e) => setForm({ ...form, applicantEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    간단한 소개 (선택)
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="학원에 전하고 싶은 말씀을 자유롭게 작성해주세요"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '제출 중...' : '가입 신청'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step 3: Pending Requests */}
        {step === 'pending' && (
          <div className="space-y-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">가입 신청 완료</h2>
              <p className="text-slate-700">
                학원 담당자가 승인하면 알림을 보내드립니다
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-4">내 신청 현황</h3>
              
              {myRequests.length === 0 ? (
                <p className="text-center text-slate-500 py-8">신청 내역이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((request) => {
                    const statusInfo = getStatusLabel(request.status);
                    return (
                      <div
                        key={request.id}
                        className="border border-slate-200 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-900">{request.applicant_name}</h4>
                            <p className="text-sm text-slate-600 mt-1">
                              신청일: {new Date(request.created_at).toLocaleDateString('ko-KR')}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>승인 대기 중입니다</span>
                          </div>
                        )}
                        
                        {request.status === 'rejected' && request.reject_reason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <p className="text-sm text-red-700">
                              <strong>반려 사유:</strong> {request.reject_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => {
                  setStep('search');
                  setSearchQuery('');
                  setSearchResults([]);
                  setSelectedOrg(null);
                }}
                className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
              >
                다른 학원 신청하기
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
