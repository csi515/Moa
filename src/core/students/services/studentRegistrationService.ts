import type { Student, Parent } from '@/types';
import { StorageService } from '@/services/storage';
import { isAttendanceModuleEnabled } from '@/core/attendance/features';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  inviteParentMember,
  syncParentStudentLinks,
} from '@/core/parent/services/parentAccountService';
import { getIndustryType } from '@/services/adapters/storageContext';

export interface StudentRegistrationOptions {
  /** 학부모 이메일 (계정 초대용) */
  parentEmail?: string;
  /** 등록과 동시에 학부모 포털 초대 발송 */
  inviteParent?: boolean;
  /** 출입 PIN (4~8자리). 미입력 시 autoGeneratePin=true이면 자동 발급 */
  checkInPin?: string;
  /** PIN 미입력 시 자동 발급 여부 (출결 모듈 활성 시 기본 true) */
  autoGeneratePin?: boolean;
  organizationId?: string;
}

export interface StudentRegistrationResult {
  student: Student;
  parent: Parent;
  generatedPin?: string;
  inviteSent: boolean;
  inviteError?: string;
}

/** 학생·학부모·출결 PIN을 한 번에 등록 */
export async function registerStudentWithParent(
  studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  options: StudentRegistrationOptions = {}
): Promise<StudentRegistrationResult> {
  const organizationId = options.organizationId || 'local-org';
  const settings = StorageService.getSettings();
  const industry = getIndustryType() || 'piano';
  const attendanceEnabled = isAttendanceModuleEnabled(settings, industry);

  const savedStudent = StorageService.saveStudent(studentData);

  const parent = StorageService.ensureParentFromStudent(savedStudent, {
    parentEmail: options.parentEmail?.trim() || undefined,
  });

  const linkedStudent = StorageService.getStudentById(savedStudent.id) || savedStudent;

  let generatedPin: string | undefined;
  if (attendanceEnabled) {
    const pin = options.checkInPin?.trim();
    if (pin) {
      const result = await StorageService.setCustomerPin(linkedStudent.id, pin, organizationId);
      if (result.ok === false) {
        throw new Error(
          result.error === 'pin_already_used'
            ? '다른 회원이 사용 중인 PIN입니다.'
            : 'PIN은 4~8자리 숫자여야 합니다.'
        );
      }
      generatedPin = pin;
    } else if (options.autoGeneratePin !== false) {
      const { pin: autoPin } = await StorageService.generateCustomerPin(
        linkedStudent.id,
        organizationId
      );
      generatedPin = autoPin;
    }
  }

  let inviteSent = false;
  let inviteError: string | undefined;

  if (isSupabaseConfigured() && organizationId !== 'local-org') {
    try {
      await syncParentStudentLinks(organizationId, parent.id, parent.studentIds);
    } catch (e) {
      console.error('Failed to sync parent-student links:', e);
    }

    const email = options.parentEmail?.trim() || parent.email?.trim();
    if (options.inviteParent && email) {
      try {
        await inviteParentMember(organizationId, parent.id, email);
        inviteSent = true;
      } catch (e) {
        inviteError = e instanceof Error ? e.message : '학부모 초대에 실패했습니다.';
      }
    }
  }

  return {
    student: StorageService.getStudentById(linkedStudent.id) || linkedStudent,
    parent: StorageService.getParents().find((p) => p.id === parent.id) || parent,
    generatedPin,
    inviteSent,
    inviteError,
  };
}

/** 수정 시 학부모 정보 동기화 */
export async function updateStudentWithParent(
  studentData: Omit<Student, 'createdAt' | 'updatedAt'> & { id: string },
  options: Pick<StudentRegistrationOptions, 'parentEmail' | 'organizationId'> = {}
): Promise<{ student: Student; parent: Parent }> {
  const savedStudent = StorageService.saveStudent(studentData);
  const parent = StorageService.ensureParentFromStudent(savedStudent, {
    parentEmail: options.parentEmail?.trim() || undefined,
  });

  const organizationId = options.organizationId;
  if (isSupabaseConfigured() && organizationId && organizationId !== 'local-org') {
    try {
      await syncParentStudentLinks(organizationId, parent.id, parent.studentIds);
    } catch (e) {
      console.error('Failed to sync parent-student links:', e);
    }
  }

  return {
    student: StorageService.getStudentById(savedStudent.id) || savedStudent,
    parent: StorageService.getParents().find((p) => p.id === parent.id) || parent,
  };
}

/** 연결된 학부모 이메일 조회 */
export function getLinkedParentEmail(student: Student): string {
  if (student.parentId) {
    const parent = StorageService.getParents().find((p) => p.id === student.parentId);
    if (parent?.email) return parent.email;
  }
  const byPhone = StorageService.getParents().find((p) => p.phone === student.parentPhone);
  return byPhone?.email || '';
}
