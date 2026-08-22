import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import {
  registerStudentWithParent,
  updateStudentWithParent,
  type GuardianRegistrationInput,
} from '@/core/students';
import { searchParents, getGuardiansForStudent } from '@/core/parent/guardianHelpers';
import { StorageService } from '@/services/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Student, Parent } from '@/types';
import { X, Save, User, RefreshCw } from 'lucide-react';
import { StudentBasicInfoSection } from './form/StudentBasicInfoSection';
import { GuardianSection } from './form/GuardianSection';
import { StudentPinSection } from './form/StudentPinSection';
import { StudentAdvancedSection } from './form/StudentAdvancedSection';
import {
  newGuardianEntry,
  type GuardianFormEntry,
  type StudentFormData,
} from './form/studentFormTypes';

interface StudentFormModalProps {
  student?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (student: Student) => void;
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

  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    gender: 'F',
    birthDate: '2015-01-01',
    phone: '',
    school: '',
    grade: '초3',
    joinDate: new Date().toISOString().slice(0, 10),
    leaveDate: '',
    status: 'active',
    teacherId: '',
    classIds: [],
    level: '바이엘 상',
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

  const updateFormData = (patch: Partial<StudentFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

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

  const buildGuardianInputs = (): GuardianRegistrationInput[] =>
    guardians.map((g) => ({
      mode: g.mode,
      existingParentId: g.mode === 'existing' ? g.existingParentId : undefined,
      name: g.name,
      phone: g.phone,
      email: g.email,
      relationship: g.relationship,
      isPrimary: g.isPrimary,
      invite: g.invite,
    }));

  const buildStudentPayload = (): Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    studentNumber?: string;
  } => {
    const targetTeacher = teachers.find((t) => t.id === formData.teacherId);
    return {
      ...(student?.id ? { id: student.id, studentNumber: student.studentNumber } : { studentNumber: '' }),
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
          <StudentBasicInfoSection formData={formData} onChange={updateFormData} />

          <GuardianSection
            isEdit={isEdit}
            canInviteParent={canInviteParent}
            guardians={guardians}
            activeSearchIdx={activeSearchIdx}
            searchResults={searchResults}
            onAddGuardian={() => setGuardians((prev) => [...prev, newGuardianEntry()])}
            onUpdateGuardian={updateGuardian}
            onSetPrimary={setPrimaryGuardian}
            onRemoveGuardian={removeGuardian}
            onSelectExistingParent={selectExistingParent}
            onFocusSearch={setActiveSearchIdx}
          />

          {attendanceEnabled && !isEdit && (
            <StudentPinSection formData={formData} onChange={updateFormData} />
          )}

          <section>
            <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
            <textarea
              rows={2}
              value={formData.memo}
              onChange={(e) => updateFormData({ memo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </section>

          <StudentAdvancedSection
            formData={formData}
            teachers={teachers}
            showAdvanced={showAdvanced}
            onToggle={() => setShowAdvanced((v) => !v)}
            onChange={updateFormData}
          />

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
