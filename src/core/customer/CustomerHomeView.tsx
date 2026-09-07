import React, { useMemo } from 'react';
import { StorageService } from '@/services/storage';
import { formatCurrency } from '@/utils/formatters';
import { TuitionService } from '@/core/finance';
import type { getMyPassSummary } from './services/studentPortalService';

type PassSummary = ReturnType<typeof getMyPassSummary>;

export function CustomerHomeView({
  customerId,
  studentId,
  organizationId,
  passSummary,
}: {
  customerId: string;
  /** CRM customer와 구분 — 출석·청구 키는 student/customer CRM id (enrollment.customerId와 동일 체계) */
  studentId: string;
  organizationId: string;
  passSummary: PassSummary;
}) {
  void customerId;
  void organizationId;
  const attendance = useMemo(
    () =>
      StorageService.getAttendance()
        .filter((a) => a.studentId === studentId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 8),
    [studentId]
  );
  const billing = TuitionService.getStudentBillingSummary(studentId);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500">잔여 이용권</p>
          <p className="text-xl font-black text-indigo-700 mt-1">{passSummary.remaining}회</p>
        </div>
        <div className="rounded-2xl bg-white border border-slate-200 p-3">
          <p className="text-[10px] font-bold text-slate-500">미납</p>
          <p className="text-xl font-black text-rose-600 mt-1">
            {formatCurrency(billing.grandUnpaid ?? billing.totalUnpaid)}
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <h2 className="text-sm font-black text-slate-900">이용권</h2>
        {passSummary.passes.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">등록된 이용권이 없습니다.</p>
        ) : (
          passSummary.passes.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center py-2 border-b border-slate-50 text-sm"
            >
              <div>
                <p className="font-bold text-slate-800">{p.label}</p>
                {p.expiresAt && (
                  <p className="text-[10px] text-slate-400">~{p.expiresAt.slice(0, 10)}</p>
                )}
              </div>
              <span className="font-black text-indigo-700">
                {p.remaining}/{p.total}
              </span>
            </div>
          ))
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
        <h2 className="text-sm font-black text-slate-900">최근 출석</h2>
        {attendance.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">출석 기록이 없습니다.</p>
        ) : (
          attendance.map((a) => (
            <div
              key={a.id}
              className="flex justify-between text-sm py-2 border-b border-slate-50"
            >
              <span className="font-mono text-slate-600">{a.date}</span>
              <span className="font-bold text-slate-800">
                {a.status === 'present'
                  ? '출석'
                  : a.status === 'absent'
                    ? '결석'
                    : a.status === 'late'
                      ? '지각'
                      : a.status}
              </span>
            </div>
          ))
        )}
        <p className="text-[11px] text-slate-400 pt-1">
          알림은 학부모 푸시가 아닌 본인 계정 알림으로 수신됩니다.
        </p>
      </section>
    </div>
  );
}
