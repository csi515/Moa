import type { ReactNode } from 'react';
import { MyAccountView } from '@/core/account';
import { AttendanceManagementView } from '@/core/attendance';
import {
  ExpenseManagementView,
  FinanceOverviewView,
  IncomeManagementView,
} from '@/core/finance';

/** 재무(수입·지출·개요) — 모든 업종 공통 */
export const financeViewEntries = {
  finance: () => <FinanceOverviewView />,
  income: () => <IncomeManagementView />,
  expenses: () => <ExpenseManagementView />,
} as const satisfies Record<string, () => ReactNode>;

/** 출결 관리 — 업종 공통 */
export const attendanceViewEntry = {
  attendance: () => <AttendanceManagementView />,
} as const satisfies Record<string, () => ReactNode>;

/** 내 계정 — 모든 역할 공통 */
export const accountViewEntry = {
  account: () => <MyAccountView />,
} as const satisfies Record<string, () => ReactNode>;
