import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import {
  registerStudentWithParent,
  updateStudentWithParent,
  getLinkedParentEmail,
} from '@/core/students';
import { StorageService } from '@/services/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Student, StudentLevel, StudentStatus } from '@/types';
import {
  X,
  Save,
  User,
  Phone,
  BookOpen,
  DollarSign,
  KeyRound,
  Mail,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

interface StudentFormModalProps {
  student?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (student: Student) => void;
}

const LEVEL_OPTIONS: StudentLevel[] = [
  '바이엘 상',
  '바이엘 하',
  '체르니 100',
  '체르니 30',
  '체르니 40',
  '체르니 50',
  '소나티네/명곡',
  '작품집/쇼팽',
  '입시/콩쿠르',
  '성인 취미',
];

const DEFAULT_FORM = {
  name: '',
  gender: 'F' as 'M' | 'F',
  birthDate: '2015-01-01',
  phone: '',
  school: '',
  grade: '초3',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  inviteParentAccount: false,
  emergencyContact: '',
  address: '',
  joinDate: new Date().toISOString().slice(0, 10),
  leaveDate: '',
  status: 'active' as StudentStatus,
  teacherId: '',
  classIds: [] as string[],
  level: '바이엘 상' as StudentLevel,
  tuitionFee: 180000,
  paymentDay: 10,
  specialNotes: '',
  memo: '',
  checkInPin: '',
  autoGeneratePin: true,
};

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useApp();
  const { industry } = usePermissions();
  const org = useOptionalOrganization();
  const organizationId = org?.currentOrganization?.id || 'local-org';

  const teachers = StorageService.getTeachers();
  const classes = StorageService.getClasses();
  const settings = StorageService.getSettings();
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);
  const canInviteParent = isSupabaseConfigured() && organizationId !== 'local-org';

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);

  const isEdit = Boolean(student?.id);

  useEffect(() => {
    if (!isOpen) return;

    if (student) {
      setFormData({
        ...DEFAULT_FORM,
        name: student.name || '',
        gender: student.gender || 'F',
        birthDate: student.birthDate || '2015-01-01',
        phone: student.phone || '',
        school: student.school || '',
        grade: student.grade || '초3',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        parentEmail: getLinkedParentEmail(student),
        inviteParentAccount: false,
        emergencyContact: student.emergencyContact || '',
        address: student.address || '',
        joinDate: student.joinDate || new Date().toISOString().slice(0, 10),
        leaveDate: student.leaveDate || '',
        status: student.status || 'active',
        teacherId: student.teacherId || teachers[0]?.id || '',
        classIds: student.classIds || [],
        level: student.level || '체르니 100',
        tuitionFee: student.tuitionFee || 180000,
        paymentDay: student.paymentDay || 10,
        specialNotes: student.specialNotes || '',
        memo: student.memo || '',
        checkInPin: '',
        autoGeneratePin: false,
      });
      setShowAdvanced(true);
    } else {
      setFormData({
        ...DEFAULT_FORM,
        teacherId: teachers[0]?.id || '',
        classIds: classes.length > 0 ? [classes[0].id] : [],
        tuitionFee: settings.defaultTuitionFee || 180000,
        paymentDay: settings.defaultPaymentDay || 10,
        autoGeneratePin: attendanceEnabled,
      });
      setShowAdvanced(false);
    }
    setRevealedPin(null);
  }, [student, isOpen, attendanceEnabled]);

  if (!isOpen) return null;

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => {
      const exists = prev.classIds.includes(classId);
      return {
        ...prev,
        classIds: exists ? prev.classIds.filter((id) => id !== classId) : [...prev.classIds, classId],
      };
    });
  };

  const buildStudentPayload = (): Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    studentNumber?: string;
  } => {
    const targetTeacher = teachers.find((t) => t.id === formData.teacherId);
    return {
      ...(student?.id ? { id: student.id, studentNumber: student.studentNumber } : {}),
      name: formData.name.trim(),
      gender: formData.gender,
      birthDate: formData.birthDate,
      phone: formData.phone.trim() || undefined,
      school: formData.school.trim(),
      grade: formData.grade.trim(),
      parentName: formData.parentName.trim(),
      parentPhone: formData.parentPhone.trim(),
      parentId: student?.parentId,
      emergencyContact: formData.emergencyContact.trim() || undefined,
      address: formData.address.trim() || undefined,
      joinDate: formData.joinDate,
      leaveDate: formData.leaveDate || undefined,
      status: formData.status,
      teacherId: formData.teacherId,
      teacherName: targetTeacher ? targetTeacher.name : '미지정',
      classIds: formData.classIds,
      level: formData.level,
      tuitionFee: Number(formData.tuitionFee) || 0,
      paymentDay: Number(formData.paymentDay) || 10,
      specialNotes: formData.specialNotes.trim() || undefined,
      memo: formData.memo.trim() || undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('학생 이름을 입력해 주세요.', 'warning');
      return;
    }
    if (!formData.parentName.trim()) {
      showToast('학부모 이름을 입력해 주세요.', 'warning');
      return;
    }
    if (!formData.parentPhone.trim()) {
      showToast('학부모 전화번호를 입력해 주세요.', 'warning');
      return;
    }
    if (formData.inviteParentAccount && !formData.parentEmail.trim()) {
      showToast('학부모 초대를 위해 이메일을 입력해 주세요.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildStudentPayload();

      if (isEdit && student?.id) {
        const { student: saved } = await updateStudentWithParent(
          { ...payload, id: student.id } as Parameters<typeof updateStudentWithParent>[0],
          { parentEmail: formData.parentEmail.trim(), organizationId }
        );
        showToast(`${saved.name} 원생 정보가 수정되었습니다.`, 'success');
        onSaved(saved);
        onClose();
        return;
      }

      const result = await registerStudentWithParent(payload as Omit<Student, 'id' | 'createdAt' | 'updatedAt'>, {
        parentEmail: formData.parentEmail.trim() || undefined,
        inviteParent: formData.inviteParentAccount,
        checkInPin: formData.checkInPin.trim() || undefined,
        autoGeneratePin: formData.autoGeneratePin,
        organizationId,
      });

      if (result.generatedPin) {
        setRevealedPin(result.generatedPin);
      }

      let message = `${result.student.name} 학생이 등록되었습니다.`;
      if (result.generatedPin) {
        message += ` 출입 PIN: ${result.generatedPin}`;
      }
      if (result.inviteSent) {
        message += ' 학부모 초대가 발송되었습니다.';
      } else if (result.inviteError) {
        showToast(result.inviteError, 'warning');
      }

      showToast(message, 'success');
      onSaved(result.student);

      if (!result.generatedPin) {
        onClose();
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEdit ? `${student!.name} 정보 수정` : '신규 학생 등록'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? '학생·학부모 정보를 수정합니다'
                  : '학생·학부모·출결 설정을 한 번에 등록합니다'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {revealedPin && (
          <div className="mx-6 mt-4 p-4 bg-indigo-600 text-white rounded-2xl text-center">
            <p className="text-xs opacity-90">발급된 출입 PIN — 학부모에게 안내해 주세요</p>
            <p className="text-3xl font-black tracking-[0.4em] font-mono mt-1">{revealedPin}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 px-4 py-2 bg-white/20 rounded-xl text-xs font-bold"
            >
              확인 후 닫기
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 학생 기본정보 */}
          <section>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 학생 기본정보
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학생 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김도윤"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">생년월일</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  연락처 <span className="text-slate-400 font-normal">(선택)</span>
                </label>
                <input
                  type="tel"
                  placeholder="학생 본인 연락처"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              {!isEdit && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">성별</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['F', 'M'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          formData.gender === g
                            ? g === 'F'
                              ? 'bg-pink-50 border-pink-300 text-pink-700'
                              : 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {g === 'F' ? '여' : '남'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 학부모 정보 */}
          <section>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> 학부모 정보
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학부모 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김은정"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학부모 전화번호 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  학부모 이메일
                </label>
                <input
                  type="email"
                  placeholder="parent@example.com"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              {canInviteParent && !isEdit && (
                <div className="sm:col-span-2 flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">학부모 계정 초대</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      이메일 입력 시 등록과 동시에 포털 초대를 발송합니다
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.inviteParentAccount}
                    disabled={!formData.parentEmail.trim()}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        inviteParentAccount: !prev.inviteParentAccount,
                      }))
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-40 ${
                      formData.inviteParentAccount ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        formData.inviteParentAccount ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 출결 설정 (신규 등록 + 모듈 활성) */}
          {attendanceEnabled && !isEdit && (
            <section>
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> 출결 설정
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">PIN 자동 발급</p>
                    <p className="text-[11px] text-slate-500">미입력 시 4자리 PIN을 자동 생성합니다</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.autoGeneratePin}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, autoGeneratePin: !prev.autoGeneratePin }))
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      formData.autoGeneratePin ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        formData.autoGeneratePin ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>
                {!formData.autoGeneratePin && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      출입 PIN (4~8자리)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      placeholder="직접 입력"
                      value={formData.checkInPin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          checkInPin: e.target.value.replace(/\D/g, ''),
                        })
                      }
                      className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 메모 */}
          <section>
            <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
            <textarea
              rows={2}
              placeholder="학원 내부 공유용 메모..."
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
            />
          </section>

          {/* 수업·수강료 (접이식) */}
          <section>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-600 hover:text-indigo-600"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                수업·수강료 설정 {isEdit ? '' : '(선택)'}
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-4 pt-3 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">학교</label>
                    <input
                      type="text"
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">학년</label>
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">재원 상태</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as StudentStatus })
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="active">재원</option>
                      <option value="leave">휴원</option>
                      <option value="withdrawn">퇴원</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">레벨</label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value as StudentLevel })
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {LEVEL_OPTIONS.map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">담당 선생님</label>
                    <select
                      value={formData.teacherId}
                      onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">입학일</label>
                    <input
                      type="date"
                      value={formData.joinDate}
                      onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {classes.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">수강 반</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {classes.map((cls) => {
                        const isChecked = formData.classIds.includes(cls.id);
                        return (
                          <button
                            type="button"
                            key={cls.id}
                            onClick={() => handleClassToggle(cls.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs ${
                              isChecked
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            {cls.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" /> 월 수강료
                    </label>
                    <CurrencyInput
                      value={formData.tuitionFee}
                      onChange={(val) => setFormData({ ...formData, tuitionFee: val })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">수납일</label>
                    <select
                      value={formData.paymentDay}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentDay: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                        <option key={day} value={day}>
                          매월 {day}일
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">특이사항</label>
                  <input
                    type="text"
                    value={formData.specialNotes}
                    onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}
          </section>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(revealedPin)}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? '수정 저장' : '학생 등록'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
