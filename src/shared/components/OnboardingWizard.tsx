import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { DayOfWeek } from '@/types';
import {
  Building2,
  GraduationCap,
  UserPlus,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { setActiveTab, showToast } = useApp();
  const [step, setStep] = useState(0);

  const [academyForm, setAcademyForm] = useState({
    name: '',
    directorName: StorageService.getActiveUser().name || '원장님',
    phone: '',
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

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyForm.name.trim()) return;
    StorageService.updateSettings({
      name: academyForm.name.trim(),
      directorName: academyForm.directorName.trim(),
      phone: academyForm.phone.trim(),
    });
    setStep(1);
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

    setStep(2);
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
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">원장님 성함</label>
              <input
                type="text"
                value={academyForm.directorName}
                onChange={(e) => setAcademyForm({ ...academyForm, directorName: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">학원 연락처</label>
              <input
                type="tel"
                placeholder="예: 010-1234-5678"
                value={academyForm.phone}
                onChange={(e) => setAcademyForm({ ...academyForm, phone: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={handleSkip} className="text-xs text-slate-400 hover:text-slate-600">
                나중에 하기
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1">
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 1 && (
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
              <input
                type="text"
                value={classForm.room}
                onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setStep(0)} className="px-4 py-2 text-xs font-semibold text-slate-600 flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> 이전
              </button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1">
                다음 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
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
