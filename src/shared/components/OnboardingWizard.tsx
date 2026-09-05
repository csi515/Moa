import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { DayOfWeek, type AcademyRoomKind } from '@/types';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import * as orgService from '@/core/organizations/services/organizationService';
import {
  ACADEMY_ROOM_KIND_LABEL,
  createAcademyRoom,
  getConfiguredRooms,
} from '@/core/academy/utils/academyRooms';
import {
  Building2,
  GraduationCap,
  UserPlus,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  DoorOpen,
  BookOpen,
  Plus,
  Trash2,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { withAttendanceModuleEnabled } from '@/core/attendance/features';
const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];

interface OnboardingWizardProps {
  onComplete: () => void;
}

type DraftRoom = { id: string; name: string; kind: AcademyRoomKind };
type DraftTextbook = { id: string; title: string; price: string };

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
  });

  const [rooms, setRooms] = useState<DraftRoom[]>([
    createAcademyRoom({ name: '피아노 1실', kind: 'classroom' }),
    createAcademyRoom({ name: '연습실 1', kind: 'practice' }),
  ]);

  const [textbooks, setTextbooks] = useState<DraftTextbook[]>([
    { id: crypto.randomUUID(), title: '바이엘', price: '15000' },
  ]);

  const [classForm, setClassForm] = useState({
    name: '',
    daysOfWeek: ['월', '수', '금'] as DayOfWeek[],
    startTime: '15:00',
    endTime: '15:50',
    room: '피아노 1실',
    textbook: '',
  });

  const [attendanceChoice, setAttendanceChoice] = useState<'pin' | 'manual' | 'later'>('later');

  const handleSkip = () => {
    StorageService.saveSettings(
      withAttendanceModuleEnabled(StorageService.getSettings(), false)
    );
    StorageService.setOnboardingComplete();
    onComplete();
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyForm.name.trim()) return;

    setIsSaving(true);
    try {
      const pinEnabled = attendanceChoice === 'pin';
      const settings = {
        name: academyForm.name.trim(),
        directorName: academyForm.directorName.trim(),
        phone: academyForm.phone.trim(),
        address: academyForm.address.trim(),
        features: {
          attendance: { enabled: pinEnabled },
        },
      };

      StorageService.updateSettings(settings);
      StorageService.saveSettings(
        withAttendanceModuleEnabled(StorageService.getSettings(), pinEnabled)
      );

      if (org?.currentOrganization) {
        await orgService.updateOrganization(org.currentOrganization.id, {
          name: settings.name,
          settings: {
            directorName: settings.directorName,
            phone: settings.phone,
            address: settings.address,
            features: settings.features,
          },
        });
        await org.refreshOrganizations();
      } else {
        await orgService.createOrganization({
          name: settings.name,
          businessRegistrationNumber: academyForm.businessRegistrationNumber.trim(),
          representativeName: settings.directorName,
          businessPhone: settings.phone,
          businessAddress: settings.address,
          industryCategory: academyForm.industryCategory.trim(),
          industryType: 'piano',
          settings: { features: settings.features },
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

  const handleSaveRooms = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = getConfiguredRooms({ rooms });
    if (cleaned.length === 0) {
      showToast('강의실·연습실을 최소 1개 등록해 주세요.', 'warning');
      return;
    }
    StorageService.updateSettings({ rooms: cleaned });
    setClassForm((prev) => ({
      ...prev,
      room: cleaned.some((r) => r.name === prev.room) ? prev.room : cleaned[0].name,
    }));
    setStep(2);
  };

  const handleSaveTextbooks = (e: React.FormEvent) => {
    e.preventDefault();
    const seeded = textbooks
      .map((t) => ({ title: t.title.trim(), price: Number(t.price) || 0 }))
      .filter((t) => t.title.length > 0);

    for (const tb of seeded) {
      const existing = StorageService.getTextbooks().find(
        (x) => x.title.toLowerCase() === tb.title.toLowerCase()
      );
      if (existing) continue;
      StorageService.saveTextbook({
        title: tb.title,
        publisher: '학원 등록',
        level: '기초',
        salePrice: tb.price || 15000,
        price: tb.price || 15000,
        stock: 0,
        minStock: 0,
        isForSale: true,
      });
    }

    if (seeded.length > 0 && !classForm.textbook) {
      setClassForm((prev) => ({ ...prev, textbook: seeded[0].title }));
    }
    setStep(3);
  };

  const handleStepClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    if (classForm.daysOfWeek.length === 0) {
      showToast('최소 1개 이상의 요일을 선택해 주세요.', 'warning');
      return;
    }

    const roomNames = getConfiguredRooms(StorageService.getSettings()).map((r) => r.name);
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
      room: classForm.room.trim() || roomNames[0] || '강의실 1',
      textbook: classForm.textbook.trim() || undefined,
      color: '#4f46e5',
    });

    setStep(4);
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

  const roomOptions = getConfiguredRooms(
    step >= 2 ? StorageService.getSettings() : { rooms }
  );
  const catalogTitles = StorageService.getTextbooks().map((t) => t.title);

  const steps = [
    { icon: Building2, label: '학원 정보' },
    { icon: DoorOpen, label: '강의실' },
    { icon: BookOpen, label: '교재' },
    { icon: GraduationCap, label: '첫 반' },
    { icon: UserPlus, label: '시작' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex items-center justify-between shrink-0">
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

        <div className="px-6 pt-5 pb-2 shrink-0">
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <React.Fragment key={s.label}>
                  <div
                    className={`flex items-center gap-1 text-[10px] font-bold ${
                      isActive ? 'text-indigo-600' : isDone ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-indigo-100' : isDone ? 'bg-emerald-50' : 'bg-slate-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
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
                  value={academyForm.businessRegistrationNumber}
                  onChange={(e) =>
                    setAcademyForm({ ...academyForm, businessRegistrationNumber: e.target.value })
                  }
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
                  onChange={(e) =>
                    setAcademyForm({ ...academyForm, industryCategory: e.target.value })
                  }
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none min-h-[44px]"
                >
                  <option value="학원">학원</option>
                  <option value="교습소">교습소</option>
                  <option value="음악교습">음악교습</option>
                </select>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-xs font-semibold text-slate-700">출결 관리 방식</p>
                <p className="text-[11px] text-slate-500">나중에 설정에서 변경할 수 있습니다.</p>
                <button
                  type="button"
                  onClick={() => setAttendanceChoice('pin')}
                  className={`w-full text-left p-3 rounded-xl border-2 min-h-[44px] ${
                    attendanceChoice === 'pin' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                    학생 PIN 출결
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceChoice('manual')}
                  className={`w-full text-left p-3 rounded-xl border-2 min-h-[44px] ${
                    attendanceChoice === 'manual' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-600" />
                    선생님 직접 출결
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAttendanceChoice('later')}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-[11px] font-semibold min-h-[44px] ${
                    attendanceChoice === 'later'
                      ? 'border-slate-400 text-slate-800 bg-slate-50'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  나중에 설정하기 (선생님 직접 출결과 동일)
                </button>
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
            <form onSubmit={handleSaveRooms} className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                학원에서 쓰는 강의실·연습실 이름을 등록합니다. 반 개설 때 이 목록에서 선택합니다.
              </p>
              <ul className="space-y-2">
                {rooms.map((room) => (
                  <li key={room.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      required
                      value={room.name}
                      onChange={(e) =>
                        setRooms((prev) =>
                          prev.map((r) => (r.id === room.id ? { ...r, name: e.target.value } : r))
                        )
                      }
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                      placeholder="예: 피아노 1실"
                    />
                    <select
                      value={room.kind}
                      onChange={(e) =>
                        setRooms((prev) =>
                          prev.map((r) =>
                            r.id === room.id
                              ? { ...r, kind: e.target.value as AcademyRoomKind }
                              : r
                          )
                        )
                      }
                      className="w-28 px-2 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                    >
                      <option value="classroom">{ACADEMY_ROOM_KIND_LABEL.classroom}</option>
                      <option value="practice">{ACADEMY_ROOM_KIND_LABEL.practice}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setRooms((prev) => prev.filter((r) => r.id !== room.id))}
                      className="p-2 text-rose-500 min-h-[44px] min-w-[44px]"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  setRooms((prev) => [
                    ...prev,
                    createAcademyRoom({ name: `강의실 ${prev.length + 1}` }),
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> 실 추가
              </button>
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
            <form onSubmit={handleSaveTextbooks} className="p-6 space-y-4">
              <p className="text-sm text-slate-500">
                주로 쓰는 교재를 등록해 두면 반 개설·판매에서 바로 고를 수 있습니다. 나중에 교재
                관리에서 추가해도 됩니다.
              </p>
              <ul className="space-y-2">
                {textbooks.map((tb) => (
                  <li key={tb.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={tb.title}
                      onChange={(e) =>
                        setTextbooks((prev) =>
                          prev.map((t) => (t.id === tb.id ? { ...t, title: e.target.value } : t))
                        )
                      }
                      className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                      placeholder="교재명"
                    />
                    <input
                      type="number"
                      min={0}
                      value={tb.price}
                      onChange={(e) =>
                        setTextbooks((prev) =>
                          prev.map((t) => (t.id === tb.id ? { ...t, price: e.target.value } : t))
                        )
                      }
                      className="w-28 px-2 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                      placeholder="가격"
                    />
                    <button
                      type="button"
                      onClick={() => setTextbooks((prev) => prev.filter((t) => t.id !== tb.id))}
                      className="p-2 text-rose-500 min-h-[44px] min-w-[44px]"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() =>
                  setTextbooks((prev) => [
                    ...prev,
                    { id: crypto.randomUUID(), title: '', price: '15000' },
                  ])
                }
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> 교재 추가
              </button>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
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

          {step === 3 && (
            <form onSubmit={handleStepClass} className="p-6 space-y-4">
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
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold min-h-[44px]"
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
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors min-h-[44px] ${
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
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">종료</label>
                  <input
                    type="time"
                    value={classForm.endTime}
                    onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">강의실</label>
                {roomOptions.length === 0 ? (
                  <p className="text-xs text-amber-700">등록된 실이 없습니다. 이전 단계에서 추가해 주세요.</p>
                ) : (
                  <select
                    value={classForm.room}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                  >
                    {roomOptions.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} ({ACADEMY_ROOM_KIND_LABEL[r.kind]})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">사용 교재</label>
                {catalogTitles.length > 0 ? (
                  <select
                    value={classForm.textbook}
                    onChange={(e) => setClassForm({ ...classForm, textbook: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                  >
                    <option value="">선택 안 함</option>
                    {catalogTitles.map((title) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={classForm.textbook}
                    onChange={(e) => setClassForm({ ...classForm, textbook: e.target.value })}
                    placeholder="예: 바이엘"
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl min-h-[44px]"
                  />
                )}
              </div>
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
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

          {step === 4 && (
            <div className="p-6 space-y-5 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                <UserPlus className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">기본 설정이 완료되었습니다!</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  강의실·교재 마스터가 저장되었습니다. 이제 원생을 등록하고 운영을 시작해 보세요.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl min-h-[44px]"
                >
                  첫 원생 등록하러 가기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    StorageService.setOnboardingComplete();
                    onComplete();
                  }}
                  className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-700 min-h-[44px]"
                >
                  대시보드로 이동
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
