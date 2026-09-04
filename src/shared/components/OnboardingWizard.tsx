import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { DayOfWeek } from '@/types';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import * as orgService from '@/core/organizations/services/organizationService';
import {
  Building2,
  GraduationCap,
  UserPlus,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  DoorOpen,
} from 'lucide-react';

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { setActiveTab, showToast } = useApp();
  const org = useOptionalOrganization();
  const [step, setStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [academyForm, setAcademyForm] = useState({
    name: '',
    directorName: StorageService.getActiveUser().name || '원장님',
    phone: '',
    address: '',
    businessRegistrationNumber: '',
    industryCategory: '학원',
    roomCount: 1,
  });

  const [classForm, setClassForm] = useState({
    name: '',
    daysOfWeek: ['월', '수', '금'] as DayOfWeek[],
    startTime: '15:00',
    endTime: '15:50',
    room: '피아노 1실',
  });

  const handleSkip = () => {
    StorageService.setOnboardingComplete();
    onComplete();
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyForm.name.trim()) return;
    
    setIsSaving(true);
    try {
      const settings = {
        name: academyForm.name.trim(),
        directorName: academyForm.directorName.trim(),
        phone: academyForm.phone.trim(),
        address: academyForm.address.trim(),
      };
      
      StorageService.updateSettings(settings);
      
      if (org?.currentOrganization) {
        await orgService.updateOrganization(org.currentOrganization.id, {
          name: settings.name,
          settings: {
            directorName: settings.directorName,
            phone: settings.phone,
            address: settings.address,
          },
        });
        await org.refreshOrganizations();
      } else {
        // Create new organization with Phase 3 required fields
        await orgService.createOrganization({
          name: settings.name,
          businessRegistrationNumber: academyForm.businessRegistrationNumber.trim(),
          representativeName: settings.directorName,
          businessPhone: settings.phone,
          businessAddress: settings.address,
          industryCategory: academyForm.industryCategory.trim(),
          industryType: 'piano',
        });
      }
      
      setStep(1);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : '학원 정보 저장 중 오류가 발생했습니다.',
        'error'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    if (classForm.daysOfWeek.length === 0) {
      showToast('최소 1개 이상의 요일을 선택해 주세요.', 'warning');
      return;
    }

    let teacher = StorageService.getTeachers()[0];
    if (!teacher) {
      teacher = StorageService.saveTeacher({
        name: academyForm.directorName.trim() || '원장님',
        specialty: '피아노',
        phone: academyForm.phone.trim() || '',
        email: '',
        hireDate: new Date().toISOString().slice(0, 10),
        status: 'active',
      });
    }

    StorageService.saveClass({
      name: classForm.name.trim(),
      teacherId: teacher.id,
      teacherName: teacher.name,
      daysOfWeek: classForm.daysOfWeek,
      startTime: classForm.startTime,
      endTime: classForm.endTime,
      capacity: 4,
      room: classForm.room.trim() || '피아노 1실',
      color: '#4f46e5',
    });

    setStep(3);
  };

  const handleFinish = () => {
    StorageService.setOnboardingComplete();
    onComplete();
    setActiveTab('students');
    showToast('학원 설정이 완료되었습니다. 첫 원생을 등록해 보세요!', 'success');
  };

  const toggleDay = (day: DayOfWeek) => {
    setClassForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const steps = [
    { icon: Building2, label: '학원 정보' },
    { icon: DoorOpen, label: '강의실 설정' },
    { icon: GraduationCap, label: '첫 반 개설' },
    { icon: UserPlus, label: '시작하기' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900">학원 설정 시작하기</h2>
          </div>
          <button
            onClick={handleSkip}
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="건너뛰기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <React.Fragment key={s.label}>
                  <div className={`flex items-center gap-1.5 text-xs font-bold ${isActive ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-indigo-100' : isDone ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {step === 0 && (
          <form onSubmit={handleStep1} className="p-6 space-y-4">
            <p className="text-sm text-slate-500">학원 기본 정보를 입력해 주세요.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학원명 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 행복 피아노 학원"
                value={academyForm.name}
                onChange={(e) => setAcademyForm({ ...academyForm, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                원장님 성함 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 김원장"
                value={academyForm.directorName}
                onChange={(e) => setAcademyForm({ ...academyForm, directorName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학원 대표 전화번호 <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="예: 010-1234-5678"
                value={academyForm.phone}
                onChange={(e) => setAcademyForm({ ...academyForm, phone: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                학원 주소 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 서울시 강남구 테헤란로 123"
                value={academyForm.address}
                onChange={(e) => setAcademyForm({ ...academyForm, address: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                사업자등록번호 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 123-45-67890"
                value={academyForm.businessRegistrationNumber}
                onChange={(e) => setAcademyForm({ ...academyForm, businessRegistrationNumber: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                업종 <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={academyForm.industryCategory}
                onChange={(e) => setAcademyForm({ ...academyForm, industryCategory: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
              >
                <option value="학원">학원</option>
                <option value="교습소">교습소</option>
                <option value="음악교습">음악교습</option>
                <option value="미술학원">미술학원</option>
                <option value="체육학원">체육학원</option>
                <option value="기타교육">기타교육</option>
              </select>
            </div>
            <div className="flex justify-between pt-2">
              <button 
                type="button" 
                onClick={handleSkip} 
                className="text-xs text-slate-400 hover:text-slate-600 min-h-[44px] px-3"
                disabled={isSaving}
              >
                나중에 하기
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 min-h-[44px] disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '다음'} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }} 
            className="p-6 space-y-4"
          >
            <p className="text-sm text-slate-500">학원의 강의실 정보를 입력해 주세요.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                강의실(교실) 개수
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAcademyForm({ ...academyForm, roomCount: Math.max(1, academyForm.roomCount - 1) })}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <div className="text-3xl font-bold text-indigo-600">{academyForm.roomCount}</div>
                  <div className="text-xs text-slate-500 mt-1">개</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAcademyForm({ ...academyForm, roomCount: Math.min(20, academyForm.roomCount + 1) })}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                피아노실, 연습실 등 수업이 진행되는 공간 개수
              </p>
            </div>
            <div className="flex justify-between pt-2">
              <button 
                type="button" 
                onClick={() => setStep(0)} 
                className="px-4 py-2 text-xs font-semibold text-slate-600 flex items-center gap-1 min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" /> 이전
              </button>
              <button 
                type="submit" 
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 min-h-[44px]"
              >
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2} className="p-6 space-y-4">
            <p className="text-sm text-slate-500">첫 정규 수업(반)을 개설해 주세요.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                반 이름 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 월수금 유치부 기초반"
                value={classForm.name}
                onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">수업 요일</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      classForm.daysOfWeek.includes(day)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">시작</label>
                <input
                  type="time"
                  value={classForm.startTime}
                  onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">종료</label>
                <input
                  type="time"
                  value={classForm.endTime}
                  onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">강의실</label>
              <select
                value={classForm.room}
                onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
              >
                {Array.from({ length: academyForm.roomCount }, (_, i) => (
                  <option key={i + 1} value={`피아노 ${i + 1}실`}>
                    피아노 {i + 1}실
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(1)} className="px-4 py-2 text-xs font-semibold text-slate-600 flex items-center gap-1 min-h-[44px]">
                <ChevronLeft className="w-4 h-4" /> 이전
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1 min-h-[44px]">
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <UserPlus className="w-8 h-8 text-emerald-600" />
            </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">기본 설정이 완료되었습니다!</h3>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                이제 첫 원생을 등록하고 출결·수강료·학습 관리를 시작해 보세요
              </p>
          </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleFinish}
                className="w-full py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
              >
                첫 원생 등록하러 가기
              </button>
              <button
                onClick={() => { StorageService.setOnboardingComplete(); onComplete(); }}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700"
              >
                대시보드로 이동
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
