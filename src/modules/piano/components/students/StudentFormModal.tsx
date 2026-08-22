import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import {
  registerStudentWithParent,
  updateStudentWithParent,
  getLinkedParentEmail,
  type GuardianRegistrationInput,
} from '@/core/students';
import {
  searchParents,
  getGuardiansForStudent,
  getParentChildNames,
  GUARDIAN_RELATIONSHIP_LABELS,
} from '@/core/parent/guardianHelpers';
import type { GuardianRelationship } from '@/core/parent/types';
import { StorageService } from '@/services/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Student, StudentLevel, StudentStatus, Parent } from '@/types';
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
  Search,
  UserPlus,
  Link2,
  Trash2,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

interface StudentFormModalProps {
  student?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (student: Student) => void;
}

interface GuardianFormEntry {
  key: string;
  mode: 'existing' | 'new';
  existingParentId: string;
  parentSearch: string;
  name: string;
  phone: string;
  email: string;
  relationship: GuardianRelationship;
  isPrimary: boolean;
  invite: boolean;
}

const LEVEL_OPTIONS: StudentLevel[] = [
  '바이엘 상', '바이엘 하', '체르니 100', '체르니 30', '체르니 40',
  '체르니 50', '소나티네/명곡', '작품집/쇼팽', '입시/콩쿠르', '성인 취미',
];

const RELATIONSHIP_OPTIONS: GuardianRelationship[] = ['father', 'mother', 'other'];

function newGuardianEntry(primary = false): GuardianFormEntry {
  return {
    key: crypto.randomUUID(),
    mode: 'new',
    existingParentId: '',
    parentSearch: '',
    name: '',
    phone: '',
    email: '',
    relationship: 'mother',
    isPrimary: primary,
    invite: false,
  };
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast, openConfirmDialog } = useApp();
  const { industry } = usePermissions();
  const org = useOptionalOrganization();
  const organizationId = org?.currentOrganization?.id || 'local-org';

  const teachers = StorageService.getTeachers();
  const classes = StorageService.getClasses();
  const settings = StorageService.getSettings();
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);
  const canInviteParent = isSupabaseConfigured() && organizationId !== 'local-org';
  const isEdit = Boolean(student?.id);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'F' as 'M' | 'F',
    birthDate: '2015-01-01',
    phone: '',
    school: '',
    grade: '초3',
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
  });

  const [guardians, setGuardians] = useState<GuardianFormEntry[]>([newGuardianEntry(true)]);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (student) {
      const linked = getGuardiansForStudent(student.id);
      setFormData({
        name: student.name || '',
        gender: student.gender || 'F',
        birthDate: student.birthDate || '2015-01-01',
        phone: student.phone || '',
        school: student.school || '',
        grade: student.grade || '초3',
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
      setGuardians(
        linked.length > 0
          ? linked.map((g) => ({
              key: crypto.randomUUID(),
              mode: 'existing' as const,
              existingParentId: g.parentId,
              parentSearch: g.parentName,
              name: g.parentName,
              phone: g.parentPhone,
              email: g.parentEmail || '',
              relationship: g.relationship,
              isPrimary: g.isPrimary,
              invite: false,
            }))
          : [newGuardianEntry(true)]
      );
      setShowAdvanced(true);
    } else {
      setFormData({
        name: '',
        gender: 'F',
        birthDate: '2015-01-01',
        phone: '',
        school: '',
        grade: '초3',
        joinDate: new Date().toISOString().slice(0, 10),
        leaveDate: '',
        status: 'active',
        teacherId: teachers[0]?.id || '',
        classIds: classes.length > 0 ? [classes[0].id] : [],
        level: '바이엘 상',
        tuitionFee: settings.defaultTuitionFee || 180000,
        paymentDay: settings.defaultPaymentDay || 10,
        specialNotes: '',
        memo: '',
        checkInPin: '',
        autoGeneratePin: attendanceEnabled,
      });
      setGuardians([newGuardianEntry(true)]);
      setShowAdvanced(false);
    }
    setRevealedPin(null);
    setActiveSearchIdx(null);
  }, [student, isOpen, attendanceEnabled]);

  const searchResults = useMemo(() => {
    if (activeSearchIdx === null) return [];
    const q = guardians[activeSearchIdx]?.parentSearch || '';
    return searchParents(q).slice(0, 8);
  }, [activeSearchIdx, guardians]);

  if (!isOpen) return null;

  const updateGuardian = (idx: number, patch: Partial<GuardianFormEntry>) => {
    setGuardians((prev) => prev.map((g, i) => (i === idx ? { ...g, ...patch } : g)));
  };

  const setPrimaryGuardian = (idx: number) => {
    setGuardians((prev) => prev.map((g, i) => ({ ...g, isPrimary: i === idx })));
  };

  const removeGuardian = (idx: number) => {
    if (guardians.length <= 1) {
      showToast('최소 1명의 보호자가 필요합니다.', 'warning');
      return;
    }

    const target = guardians[idx];
    const doRemove = () => {
      setGuardians((prev) => {
        const next = prev.filter((_, i) => i !== idx);
        if (!next.some((g) => g.isPrimary)) next[0].isPrimary = true;
        return next;
      });
    };

    if (isEdit && target.existingParentId) {
      openConfirmDialog({
        title: '보호자 연결 해제',
        message: `${target.name || '선택한 보호자'}와의 연결을 해제할까요?\n저장 시 이 학생과의 link만 제거됩니다.`,
        confirmText: '연결 해제',
        isDestructive: true,
        onConfirm: doRemove,
      });
      return;
    }

    doRemove();
  };

  const selectExistingParent = (idx: number, parent: Parent) => {
    updateGuardian(idx, {
      mode: 'existing',
      existingParentId: parent.id,
      parentSearch: parent.name,
      name: parent.name,
      phone: parent.phone,
      email: parent.email || '',
    });
    setActiveSearchIdx(null);
  };

  const buildGuardianInputs = (): GuardianRegistrationInput[] => {
    return guardians.map((g) => ({
      mode: g.mode,
      existingParentId: g.mode === 'existing' ? g.existingParentId : undefined,
      name: g.name,
      phone: g.phone,
      email: g.email,
      relationship: g.relationship,
      isPrimary: g.isPrimary,
      invite: g.invite,
    }));
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
      emergencyContact: undefined,
      address: undefined,
      joinDate: formData.joinDate,
      leaveDate: formData.leaveDate || undefined,
      status: formData.status,
      teacherId: formData.teacherId,
      teacherName: targetTeacher?.name || '미지정',
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

    for (const g of guardians) {
      if (g.mode === 'existing' && !g.existingParentId) {
        showToast('기존 학부모를 선택하거나 새로 등록해 주세요.', 'warning');
        return;
      }
      if (g.mode === 'new' && (!g.name.trim() || !g.phone.trim())) {
        showToast('학부모 이름과 전화번호를 입력해 주세요.', 'warning');
        return;
      }
      if (g.invite && !g.email.trim()) {
        showToast('학부모 초대를 위해 이메일을 입력해 주세요.', 'warning');
        return;
      }
    }

    const parentKeys = guardians.map((g) =>
      g.mode === 'existing' && g.existingParentId
        ? `id:${g.existingParentId}`
        : `phone:${g.phone.trim()}`
    );
    if (new Set(parentKeys).size !== parentKeys.length) {
      showToast('같은 보호자가 중복 등록되어 있습니다.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildStudentPayload();
      const guardianInputs = buildGuardianInputs();

      if (isEdit && student?.id) {
        const { student: saved } = await updateStudentWithParent(
          { ...payload, id: student.id },
          { guardians: guardianInputs, organizationId }
        );
        showToast(`${saved.name} 학생 정보가 수정되었습니다.`, 'success');
        onSaved(saved);
        onClose();
        return;
      }

      const result = await registerStudentWithParent(payload, {
        guardians: guardianInputs,
        checkInPin: formData.checkInPin.trim() || undefined,
        autoGeneratePin: formData.autoGeneratePin,
        organizationId,
      });

      if (result.generatedPin) setRevealedPin(result.generatedPin);

      let message = `${result.student.name} 학생이 등록되었습니다.`;
      if (result.generatedPin) message += ` 출입 PIN: ${result.generatedPin}`;
      if (result.invitesSent > 0) message += ` (학부모 초대 ${result.invitesSent}건)`;
      showToast(message, 'success');
      result.inviteErrors.forEach((err) => showToast(err, 'warning'));
      onSaved(result.student);
      if (!result.generatedPin) onClose();
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
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEdit ? `${student!.name} 정보 수정` : '신규 학생 등록'}
              </h3>
              <p className="text-xs text-slate-500">학생·학부모를 links 기반으로 연결합니다</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {revealedPin && (
          <div className="mx-6 mt-4 p-4 bg-indigo-600 text-white rounded-2xl text-center">
            <p className="text-xs opacity-90">발급된 출입 PIN</p>
            <p className="text-3xl font-black tracking-[0.4em] font-mono mt-1">{revealedPin}</p>
            <button type="button" onClick={onClose} className="mt-3 px-4 py-2 bg-white/20 rounded-xl text-xs font-bold">
              확인 후 닫기
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* 학생 정보 */}
          <section>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 학생 정보
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학생 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">생년월일</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">연락처 (선택)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 학부모 연결 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> 학부모 연결
                </h4>
                {isEdit && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    부·모 각각 별도 계정으로 연결할 수 있습니다. 보호자 추가 후 저장하면 link가 반영됩니다.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setGuardians((prev) => [...prev, newGuardianEntry()])}
                className="text-xs font-bold text-indigo-600 flex items-center gap-1 shrink-0 min-h-[44px] px-2"
              >
                <UserPlus className="w-3.5 h-3.5" /> 보호자 추가
              </button>
            </div>

            <div className="space-y-4">
              {guardians.map((g, idx) => (
                <div key={g.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      보호자 {idx + 1}
                      {g.isPrimary && (
                        <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md">
                          주 보호자
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      {!g.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimaryGuardian(idx)}
                          className="text-[10px] text-indigo-600 font-bold"
                        >
                          주 보호자로
                        </button>
                      )}
                      {guardians.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeGuardian(idx)}
                          className="text-rose-500 min-w-[44px] min-h-[44px] flex items-center justify-center"
                          title="연결 해제"
                          aria-label="보호자 연결 해제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => updateGuardian(idx, { mode: 'existing' })}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                        g.mode === 'existing'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <Link2 className="w-3 h-3 inline mr-1" />
                      기존 학부모
                    </button>
                    <button
                      type="button"
                      onClick={() => updateGuardian(idx, { mode: 'new', existingParentId: '' })}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border ${
                        g.mode === 'new'
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <UserPlus className="w-3 h-3 inline mr-1" />
                      새 학부모
                    </button>
                  </div>

                  {g.mode === 'existing' ? (
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        placeholder="이름·전화·자녀명으로 검색"
                        value={g.parentSearch}
                        onFocus={() => setActiveSearchIdx(idx)}
                        onChange={(e) =>
                          updateGuardian(idx, {
                            parentSearch: e.target.value,
                            existingParentId: '',
                          })
                        }
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                      />
                      {activeSearchIdx === idx && searchResults.length > 0 && (
                        <div className="absolute z-10 inset-x-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {searchResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectExistingParent(idx, p)}
                              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 border-b border-slate-50 last:border-0"
                            >
                              <p className="text-sm font-bold text-slate-900">{p.name}</p>
                              <p className="text-[10px] text-slate-500">{p.phone}</p>
                              <p className="text-[10px] text-indigo-600">
                                자녀: {getParentChildNames(p).join(', ') || '없음'}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="학부모 이름 *"
                        value={g.name}
                        onChange={(e) => updateGuardian(idx, { name: e.target.value })}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="전화번호 *"
                        value={g.phone}
                        onChange={(e) => updateGuardian(idx, { phone: e.target.value })}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">관계</label>
                      <select
                        value={g.relationship}
                        onChange={(e) =>
                          updateGuardian(idx, { relationship: e.target.value as GuardianRelationship })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                      >
                        {RELATIONSHIP_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {GUARDIAN_RELATIONSHIP_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> 이메일
                      </label>
                      <input
                        type="email"
                        value={g.email}
                        onChange={(e) => updateGuardian(idx, { email: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  {canInviteParent && g.mode === 'new' && (
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      <input
                        type="checkbox"
                        checked={g.invite}
                        onChange={(e) => updateGuardian(idx, { invite: e.target.checked })}
                        disabled={!g.email.trim()}
                      />
                      등록과 동시에 학부모 포털 초대
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 출결 PIN */}
          {attendanceEnabled && !isEdit && (
            <section>
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> 출입 PIN
              </h4>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={formData.autoGeneratePin}
                    onChange={(e) => setFormData({ ...formData, autoGeneratePin: e.target.checked })}
                  />
                  PIN 자동 발급 (4자리)
                </label>
                {!formData.autoGeneratePin && (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="직접 입력 (4~8자리)"
                    value={formData.checkInPin}
                    onChange={(e) =>
                      setFormData({ ...formData, checkInPin: e.target.value.replace(/\D/g, '') })
                    }
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl bg-white"
                  />
                )}
              </div>
            </section>
          )}

          {/* 메모 */}
          <section>
            <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
            <textarea
              rows={2}
              value={formData.memo}
              onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </section>

          {/* 수업·수강료 (접이식) */}
          <section>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-600"
            >
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> 수업·수강료 (선택)
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showAdvanced && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <input
                  type="text"
                  placeholder="학교"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="학년"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as StudentLevel })}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {LEVEL_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <CurrencyInput
                  value={formData.tuitionFee}
                  onChange={(val) => setFormData({ ...formData, tuitionFee: val })}
                />
                <select
                  value={formData.paymentDay}
                  onChange={(e) => setFormData({ ...formData, paymentDay: Number(e.target.value) })}
                  className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                    <option key={d} value={d}>매월 {d}일</option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 rounded-xl">
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(revealedPin)}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? '수정 저장' : '학생 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
