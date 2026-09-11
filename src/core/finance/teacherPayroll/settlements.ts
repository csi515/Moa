import { getItem, setItem } from '@/services/storage/helpers';
import { STORAGE_KEYS } from '@/services/adapters/storageKeys';
import type { TeacherPayType } from '@/types';

/** 강사 월별 정산 확정 기록 (localStorage only — Supabase 미동기화, 기기 간 미공유) */
export interface TeacherPayrollSettlement {
  id: string;
  teacherId: string;
  yearMonth: string;
  payType: TeacherPayType;
  quantity: number;
  rate: number;
  calculatedAmount: number;
  adjustmentAmount: number;
  adjustmentReason?: string;
  finalAmount: number;
  confirmedAt: string;
  /** 지출 등록 시 연결 */
  expenseId?: string;
}

function generateSettlementId(): string {
  return `tps_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getTeacherPayrollSettlements(): TeacherPayrollSettlement[] {
  return getItem<TeacherPayrollSettlement[]>(STORAGE_KEYS.TEACHER_PAYROLL_SETTLEMENTS, []);
}

export function saveTeacherPayrollSettlement(
  input: Omit<TeacherPayrollSettlement, 'id' | 'confirmedAt'> & {
    id?: string;
    confirmedAt?: string;
  }
): TeacherPayrollSettlement {
  const list = getTeacherPayrollSettlements();
  const existingIdx = list.findIndex(
    (s) =>
      (input.id && s.id === input.id) ||
      (s.teacherId === input.teacherId && s.yearMonth === input.yearMonth)
  );

  const saved: TeacherPayrollSettlement = {
    id: input.id || (existingIdx >= 0 ? list[existingIdx].id : generateSettlementId()),
    teacherId: input.teacherId,
    yearMonth: input.yearMonth,
    payType: input.payType,
    quantity: input.quantity,
    rate: input.rate,
    calculatedAmount: input.calculatedAmount,
    adjustmentAmount: input.adjustmentAmount || 0,
    adjustmentReason: input.adjustmentReason,
    finalAmount: Math.max(0, Math.round(input.finalAmount)),
    confirmedAt: input.confirmedAt || new Date().toISOString(),
    expenseId: input.expenseId ?? (existingIdx >= 0 ? list[existingIdx].expenseId : undefined),
  };

  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...saved };
  } else {
    list.unshift(saved);
  }
  setItem(STORAGE_KEYS.TEACHER_PAYROLL_SETTLEMENTS, list);
  return saved;
}

export function linkPayrollSettlementExpense(
  teacherId: string,
  yearMonth: string,
  expenseId: string
): TeacherPayrollSettlement | null {
  const list = getTeacherPayrollSettlements();
  const idx = list.findIndex((s) => s.teacherId === teacherId && s.yearMonth === yearMonth);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], expenseId };
  setItem(STORAGE_KEYS.TEACHER_PAYROLL_SETTLEMENTS, list);
  return list[idx];
}

export function deleteTeacherPayrollSettlement(teacherId: string, yearMonth: string): boolean {
  const list = getTeacherPayrollSettlements();
  const next = list.filter((s) => !(s.teacherId === teacherId && s.yearMonth === yearMonth));
  if (next.length === list.length) return false;
  setItem(STORAGE_KEYS.TEACHER_PAYROLL_SETTLEMENTS, next);
  return true;
}
