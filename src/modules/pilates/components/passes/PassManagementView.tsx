import React, { useMemo, useState } from 'react';
import { Ticket } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import { StorageService } from '@/services/storage';
import type { SessionPass, SessionPassStatus } from '@/core/types/schedule';
import { getPassRemaining } from '@/core/schedules/sessionPassUtils';
import { EmptyState, FilterTabs, Modal, PageHeader, type FilterTabItem } from '@/shared/components';

type PassFilter = 'active' | 'all';

const FILTERS: FilterTabItem<PassFilter>[] = [
  { id: 'active', label: '사용 중' },
  { id: 'all', label: '전체' },
];

const STATUS_LABEL: Record<SessionPassStatus, string> = {
  active: '사용 중',
  exhausted: '소진',
  cancelled: '취소',
};

export const PassManagementView: React.FC = () => {
  const { showToast } = useApp();
  const refreshKey = useStorageRefresh();
  const [filter, setFilter] = useState<PassFilter>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [memberId, setMemberId] = useState('');
  const [label, setLabel] = useState('10회 이용권');
  const [totalSessions, setTotalSessions] = useState(10);
  const [expiresAt, setExpiresAt] = useState('');
  const [memo, setMemo] = useState('');

  const members = useMemo(
    () => StorageService.getStudents().filter((s) => s.status === 'active'),
    [refreshKey]
  );
  const passes = useMemo(() => ScheduleService.getSessionPasses(), [refreshKey]);

  const filtered = useMemo(() => {
    const list = [...passes].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
    if (filter === 'active') return list.filter((p) => p.status === 'active' && getPassRemaining(p) > 0);
    return list;
  }, [passes, filter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === memberId);
    if (!member) {
      showToast('회원을 선택해 주세요.', 'warning');
      return;
    }
    if (totalSessions < 1) {
      showToast('횟수는 1회 이상이어야 합니다.', 'warning');
      return;
    }

    ScheduleService.saveSessionPass({
      customerId: member.id,
      customerName: member.name,
      label: label.trim() || `${totalSessions}회 이용권`,
      totalSessions,
      usedSessions: 0,
      status: 'active',
      purchasedAt: new Date().toISOString(),
      expiresAt: expiresAt ? `${expiresAt}T23:59:59` : undefined,
      memo: memo.trim() || undefined,
    });

    showToast('이용권이 등록되었습니다.', 'success');
    setIsModalOpen(false);
    setMemberId('');
    setMemo('');
  };

  const cancelPass = (pass: SessionPass) => {
    ScheduleService.saveSessionPass({ ...pass, status: 'cancelled' });
    showToast('이용권을 취소했습니다.', 'info');
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Ticket className="w-5 h-5" />}
        iconClassName="text-teal-600"
        title="이용권 관리"
        description="횟수제 이용권을 등록하고 잔여 횟수를 관리합니다. 수업 완료 시 1회 차감됩니다."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl min-h-[44px]"
          >
            + 이용권 등록
          </button>
        }
      />

      <FilterTabs tabs={FILTERS} active={filter} onChange={setFilter} activeClassName="bg-teal-600 text-white" />

      {filtered.length === 0 ? (
        <EmptyState icon={<Ticket className="w-10 h-10" />} title="이용권이 없습니다" />
      ) : (
        <div className="space-y-3">
          {filtered.map((pass) => {
            const remaining = getPassRemaining(pass);
            return (
              <div key={pass.id} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{pass.customerName}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{pass.label}</p>
                    <p className="text-xs text-teal-700 font-semibold mt-1">
                      잔여 {remaining}회 / 전체 {pass.totalSessions}회
                      {pass.expiresAt
                        ? ` · ~${pass.expiresAt.slice(0, 10)}`
                        : ''}
                    </p>
                    {pass.memo && <p className="text-[11px] text-slate-400 mt-1">{pass.memo}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {STATUS_LABEL[pass.status]}
                    </span>
                    {pass.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => cancelPass(pass)}
                        className="px-2 py-1 text-xs font-bold bg-rose-100 text-rose-700 rounded-lg min-h-[44px]"
                      >
                        취소
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="이용권 등록">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">회원 *</label>
            <select
              required
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
            >
              <option value="">선택</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">이용권 이름</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              placeholder="10회 이용권"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">총 횟수 *</label>
              <input
                type="number"
                min={1}
                required
                value={totalSessions}
                onChange={(e) => setTotalSessions(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">만료일</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl min-h-[44px]"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm min-h-[44px]"
          >
            등록
          </button>
        </form>
      </Modal>
    </div>
  );
};
