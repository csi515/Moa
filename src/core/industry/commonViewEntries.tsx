import type { ReactNode } from 'react';
import { MyAccountView } from '@/core/account';
import { AttendanceManagementView } from '@/core/attendance';
import { FinanceHubView } from '@/core/finance';

/** 재무 허브 — 요약·수입·지출·수납·미수금 (딥링크 탭도 동일 허브) */
export const financeViewEntries = {
  finance: () => <FinanceHubView />,
  income: () => <FinanceHubView />,
  expenses: () => <FinanceHubView />,
  tuition: () => <FinanceHubView />,
  unpaid: () => <FinanceHubView />,
} as const satisfies Record<string, () => ReactNode>;

/** 출결 관리 — 업종 공통 */
export const attendanceViewEntry = {
  attendance: () => <AttendanceManagementView />,
} as const satisfies Record<string, () => ReactNode>;

/** 내 계정 — 모든 역할 공통 */
export const accountViewEntry = {
  account: () => <MyAccountView />,
} as const satisfies Record<string, () => ReactNode>;
