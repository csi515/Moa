import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { useOptionalOrganization } from '@/core/organizations/OrganizationProvider';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import { ParentInviteResultModal } from '@/modules/parent/ParentInviteResultModal';
import type { StudentRegistrationInviteResult } from '@/core/students/services/studentRegistrationService';
import {
  registerStudentWithParent,
  updateStudentWithParent,
  type GuardianRegistrationInput,
} from '@/core/students';
import { getStudentLevelOptions } from '@/core/students/levelOptions';
import { getIndustryPlugin } from '@/core/industry/registry';
import { getPlaceLabel, isSkinClinicIndustry } from '@/core/industry/industryUi';
import { useModuleLabels } from '@/core/labels';
import { createPickupAddress, normalizePickupAddresses, sanitizePickupAddressesForSave } from '@/core/transport';
import { searchParents, getGuardiansForStudent } from '@/core/parent/guardianHelpers';
import { StorageService } from '@/services/storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Student, Parent } from '@/types';
import { X, Save, User, RefreshCw } from 'lucide-react';
import { StudentBasicInfoSection } from './form/StudentBasicInfoSection';
import { GuardianSection } from './form/GuardianSection';
import { StudentPinSection } from './form/StudentPinSection';
import { StudentAdvancedSection } from './form/StudentAdvancedSection';
import { StudentPickupSection } from './form/StudentPickupSection';
import {
  combineStudentNotes,
  newGuardianEntry,
  type GuardianFormEntry,
  type StudentFormData,
} from './form/studentFormTypes';

interface StudentFormModalProps {
  student?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (student: Student, options?: { openTab?: 'attendance' | 'tuition' | 'consultations' | 'classes' }) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast, openConfirmDialog } = useApp();
  const { industry } = usePermissions();
  const labels = useModuleLabels();
  const skin = isSkinClinicIndustry(industry);
  const customerLabel = skin ? labels.customer.singular : '학생';
  const contactLabel = skin ? labels.contact.singular : '학부모';
  const placeLabel = getPlaceLabel(industry);
  const org = useOptionalOrganization();
  const organizationId = org?.currentOrganization?.id || 'local-org';

  const teachers = StorageService.getTeachers();
  const classes = StorageService.getClasses();
  const settings = StorageService.getSettings();
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);
  const defaultLevel = getStudentLevelOptions(industry)[0];
  const showPickupFields = getIndustryPlugin(industry).showPickupFields;
  const canInviteParent = isSupabaseConfigured() && organizationId !== 'local-org';
  const isEdit = Boolean(student?.id);

  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    gender: '',
    birthDate: '',
    phone: '',
    school: '',
    grade: '',
    joinDate: new Date().toISOString().slice(0, 10),
    leaveDate: '',
    status: 'active',
    teacherId: '',
    classIds: [],
    level: defaultLevel,
    billingMode: 'monthly',
    tuitionFee: 180000,
    paymentDay: 10,
    specialNotes: '',
    memo: '',
    address: '',
    usesShuttleService: false,
    pickupAddresses: [createPickupAddress({ isDefault: true })],
    checkInPin: '',
    autoGeneratePin: true,
  });

  const [guardians, setGuardians] = useState<GuardianFormEntry[]>([newGuardianEntry(true)]);
  /** 성인 수강생 — 보호자 없이 본인만 등록 */
  const [isAdultSelf, setIsAdultSelf] = useState(false);
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(!isEdit);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [inviteModal, setInviteModal] = useState<StudentRegistrationInviteResult | null>(null);
  const [postSaveStudent, setPostSaveStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (student) {
      const linked = getGuardiansForStudent(student.id);
      setFormData({
        name: student.name || '',
        gender: student.gender || '',
        birthDate: student.birthDate || '',
        phone: student.phone || '',
        school: student.school || '',
        grade: student.grade || '',
        joinDate: student.joinDate || new Date().toISOString().slice(0, 10),
        leaveDate: student.leaveDate || '',
        status: student.status || 'active',
        teacherId: student.teacherId || teachers[0]?.id || '',
        classIds: student.classIds || [],
        level: student.level || defaultLevel,
        billingMode: student.billingMode === 'session_pass' ? 'session_pass' : 'monthly',
        tuitionFee: student.tuitionFee || 180000,
        paymentDay: student.paymentDay || 10,
        specialNotes: combineStudentNotes(student.specialNotes, student.memo),
        memo: '',
        address: student.address || '',
        usesShuttleService: student.usesShuttleService ?? false,
        pickupAddresses:
          student.pickupAddresses && student.pickupAddresses.length > 0
            ? normalizePickupAddresses(student.pickupAddresses)
            : [createPickupAddress({ isDefault: true })],
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
        gender: '',
        birthDate: '',
        phone: '',
        school: '',
        grade: '',
        joinDate: new Date().toISOString().slice(0, 10),
        leaveDate: '',
        status: 'active',
        teacherId: teachers[0]?.id || '',
        classIds: classes.length > 0 ? [classes[0].id] : [],
        level: defaultLevel,
        billingMode:
          settings.defaultBillingMode === 'session_pass' ? 'session_pass' : 'monthly',
        tuitionFee: settings.defaultTuitionFee || 180000,
        paymentDay: settings.defaultPaymentDay || 10,
        specialNotes: '',
        memo: '',
        address: '',
        usesShuttleService: false,
        pickupAddresses: [createPickupAddress({ isDefault: true })],
        checkInPin: '',
        autoGeneratePin: attendanceEnabled,
      });
      setGuardians([newGuardianEntry(true)]);
      setShowAdvanced(false);
    }
    setRevealedPin(null);
    setActiveSearchIdx(null);
    setPostSaveStudent(null);
  }, [student, isOpen, attendanceEnabled, defaultLevel, teachers, classes, settings]);

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
      showToast('최소 1명의 보호자를 등록해야 합니다', 'warning');
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
        message: `${target.name || '선택한 보호자'}와의 연결을 해제할까요?\n저장 시 이 ${customerLabel}과의 link만 제거됩니다.`,
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
      gender: formData.gender === 'M' || formData.gender === 'F' ? formData.gender : ('' as Student['gender']),
      birthDate: formData.birthDate || '',
      phone: formData.phone.trim() || undefined,
      school: formData.school.trim(),
      grade: formData.grade.trim(),
      emergencyContact: undefined,
      address: formData.address.trim() || undefined,
      usesShuttleService: showPickupFields ? formData.usesShuttleService : undefined,
      pickupAddresses: showPickupFields
        ? sanitizePickupAddressesForSave(formData.pickupAddresses, formData.usesShuttleService)
        : undefined,
      joinDate: formData.joinDate,
      leaveDate: formData.leaveDate || undefined,
      status: formData.status,
      teacherId: formData.teacherId,
      teacherName: targetTeacher?.name || '미지정',
      classIds: formData.classIds,
      level: formData.level,
      billingMode: formData.billingMode,
      tuitionFee: Number(formData.tuitionFee) || 0,
      paymentDay: Number(formData.paymentDay) || 10,
      specialNotes: formData.specialNotes.trim() || undefined,
      // 등록·수정 시 특이사항으로 통합 저장 (기존 memo는 삭제하지 않고 비워 중복 표시 방지)
      memo: undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast(`필수 항목: ${customerLabel} 이름을 입력해 주세요`, 'warning');
      return;
    }

    for (const g of guardians) {
      if (isAdultSelf) break;
      if (g.mode === 'existing' && !g.existingParentId) {
        showToast(`검색 결과에서 기존 ${contactLabel}를 선택하거나 새로 등록해 주세요`, 'warning');
        return;
      }
      if (g.mode === 'new' && (!g.name.trim() || !g.phone.trim())) {
        showToast(`필수 항목: ${contactLabel} 이름과 전화번호를 모두 입력해 주세요`, 'warning');
        return;
      }
      if (g.invite && !g.email.trim()) {
        showToast(`초대 기능 사용 시 ${contactLabel} 이메일을 입력해 주세요`, 'warning');
        return;
      }
    }

    if (!isAdultSelf) {
      const parentKeys = guardians.map((g) =>
        g.mode === 'existing' && g.existingParentId
          ? `id:${g.existingParentId}`
          : `phone:${g.phone.trim()}`
      );
      if (new Set(parentKeys).size !== parentKeys.length) {
        showToast('중복 오류: 같은 보호자를 여러 번 등록할 수 없습니다', 'warning');
        return;
      }
    }

    if (showPickupFields && formData.usesShuttleService) {
      const hasAddress = formData.pickupAddresses.some((a) => a.address.trim());
      if (!hasAddress) {
        showToast('셔틀 이용 시 픽업·하원 주소를 최소 1곳 입력해 주세요', 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = buildStudentPayload();
      const guardianInputs = isAdultSelf ? [] : buildGuardianInputs();

      if (isEdit && student?.id) {
        const { student: saved } = await updateStudentWithParent(
          { ...payload, id: student.id },
          { guardians: guardianInputs, organizationId }
        );
        showToast(`${saved.name} ${customerLabel} 정보가 수정되었습니다.`, 'success');
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

      let message = `${result.student.name} ${customerLabel}이 등록되었습니다.`;
      if (result.generatedPin) message += ` 출입 PIN: ${result.generatedPin}`;
      if (result.invitesSent > 0) message += ` (${contactLabel} 초대 ${result.invitesSent}건)`;
      showToast(message, 'success');
      result.inviteErrors.forEach((err) => showToast(err, 'warning'));
      setPostSaveStudent(result.student);

      const invitedWithCodes = result.inviteResults.find(
        (item) => item.result.linkCodes.length > 0
      );
      if (invitedWithCodes) {
        setInviteModal(invitedWithCodes);
      }
      // PIN·초대 모달이 없어도 바로 닫지 않고 다음 액션을 안내
    } catch (err) {
      showToast(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl lg:max-w-4xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEdit ? `${student!.name} 정보 수정` : `신규 ${customerLabel} 등록`}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? '필요한 항목만 수정하세요'
                  : '이름은 필수, 나머지는 나중에 보완할 수 있습니다'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (postSaveStudent) onSaved(postSaveStudent);
              onClose();
            }}
            className="text-slate-400 hover:text-slate-600 p-1.5 min-h-[44px] min-w-[44px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {revealedPin && (
          <div className="mx-6 mt-4 p-4 bg-indigo-600 text-white rounded-2xl text-center">
            <p className="text-xs opacity-90">발급된 출입 PIN</p>
            <p className="text-3xl font-black tracking-[0.4em] font-mono mt-1">{revealedPin}</p>
          </div>
        )}

        {postSaveStudent && !inviteModal && (
          <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
            <p className="text-sm font-bold text-emerald-900">
              {postSaveStudent.name} 등록 완료 — 다음으로?
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  onSaved(postSaveStudent);
                  onClose();
                }}
                className="min-h-[44px] px-3 rounded-xl text-xs font-bold bg-white border border-emerald-200 text-emerald-800"
              >
                상세 보기
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaved(postSaveStudent, { openTab: 'attendance' });
                  onClose();
                }}
                className="min-h-[44px] px-3 rounded-xl text-xs font-bold bg-white border border-emerald-200 text-emerald-800"
              >
                출결 기록
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaved(postSaveStudent, { openTab: 'tuition' });
                  onClose();
                }}
                className="min-h-[44px] px-3 rounded-xl text-xs font-bold bg-white border border-emerald-200 text-emerald-800"
              >
                수납 확인
              </button>
              <button
                type="button"
                onClick={() => {
                  onSaved(postSaveStudent);
                  onClose();
                }}
                className="min-h-[44px] px-3 rounded-xl text-xs font-bold text-slate-600"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`p-6 space-y-5 max-h-[75vh] overflow-y-auto ${postSaveStudent ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            <StudentBasicInfoSection formData={formData} onChange={updateFormData} />

            <div className="space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 cursor-pointer min-h-[52px]">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600"
                  checked={isAdultSelf}
                  onChange={(e) => setIsAdultSelf(e.target.checked)}
                />
                <span>
                  <span className="block text-xs font-bold text-slate-800">성인 수강생 (보호자 없음)</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    본인 계정으로 수강하는 경우 보호자 정보를 생략합니다.
                  </span>
                </span>
              </label>

              {!isAdultSelf && (
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
              )}
            </div>
          </div>

          {attendanceEnabled && !isEdit && (
            <StudentPinSection formData={formData} onChange={updateFormData} />
          )}

          {showPickupFields && (
            <StudentPickupSection
              address={formData.address}
              usesShuttleService={formData.usesShuttleService}
              pickupAddresses={formData.pickupAddresses}
              onAddressChange={(address) => updateFormData({ address })}
              onUsesShuttleChange={(usesShuttleService) => {
                const pickupAddresses =
                  usesShuttleService && formData.pickupAddresses.length === 0
                    ? [createPickupAddress({ isDefault: true })]
                    : formData.pickupAddresses;
                updateFormData({ usesShuttleService, pickupAddresses });
              }}
              onPickupAddressesChange={(pickupAddresses) => updateFormData({ pickupAddresses })}
            />
          )}

          <section>
            <label className="block text-xs font-semibold text-slate-700 mb-1">특이사항</label>
            <textarea
              rows={3}
              value={formData.specialNotes}
              onChange={(e) => updateFormData({ specialNotes: e.target.value, memo: '' })}
              placeholder="알레르기, 건강 관련 주의사항, 기타 전달사항 등을 입력하세요."
              className="w-full px-3 py-2 text-sm bg-amber-50/60 border border-amber-100 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:outline-none min-h-[88px]"
            />
          </section>

          <StudentAdvancedSection
            formData={formData}
            teachers={teachers}
            classes={classes}
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
              disabled={isSubmitting || Boolean(revealedPin) || Boolean(postSaveStudent)}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl flex items-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? '수정 저장' : `${customerLabel} 등록`}
            </button>
          </div>
        </form>
      </div>

      {inviteModal && (
        <ParentInviteResultModal
          parentName={inviteModal.parentName}
          email={inviteModal.email}
          organizationName={
            inviteModal.result.organizationName || org?.currentOrganization?.name || placeLabel
          }
          linkCodes={inviteModal.result.linkCodes}
          contactLabel={contactLabel}
          emailSent={inviteModal.emailSent}
          emailMessage={inviteModal.emailMessage}
          onClose={() => {
            setInviteModal(null);
            if (postSaveStudent) {
              // 초대 모달 닫은 뒤 다음 액션 패널을 보여 줌
              return;
            }
            if (!revealedPin) onClose();
          }}
        />
      )}
    </div>
  );
};
