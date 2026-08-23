import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { CareProgramService } from '@/modules/skincare/services/careProgramService';
import type { CareEnrollment, CareProgram } from '@/modules/skincare/types/careProgram';
import {
  EmptyState,
  FilterTabs,
  Modal,
  PageHeader,
  SearchField,
  SummaryMetricCard,
  type FilterTabItem,
} from '@/shared/components';
import { formatCurrency } from '@/utils/formatters';
import { Minus, Plus, Ticket, Trash2 } from 'lucide-react';

type EnrollFilter = 'active' | 'all' | 'completed';

const ENROLL_FILTERS: FilterTabItem<EnrollFilter>[] = [
  { id: 'active', label: '진행중' },
  { id: 'completed', label: '완료/만료' },
  { id: 'all', label: '전체' },
];

const STATUS_LABEL: Record<CareEnrollment['status'], string> = {
  active: '진행중',
  completed: '완료',
  expired: '만료',
  cancelled: '취소',
};

export const CareProgramManagementView: React.FC = () => {
  const { showToast, openConfirmDialog } = useApp();
  const refreshKey = useStorageRefresh();

  const [enrollFilter, setEnrollFilter] = useState<EnrollFilter>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<CareProgram | null>(null);

  const [programName, setProgramName] = useState('');
  const [programSessions, setProgramSessions] = useState(10);
  const [programPrice, setProgramPrice] = useState(500000);
  const [programValidity, setProgramValidity] = useState(90);
  const [programDesc, setProgramDesc] = useState('');

  const [enrollCustomerId, setEnrollCustomerId] = useState('');
  const [enrollProgramId, setEnrollProgramId] = useState('');
  const [enrollDate, setEnrollDate] = useState(new Date().toISOString().slice(0, 10));

  const programs = useMemo(() => CareProgramService.getPrograms(), [refreshKey]);
  const enrollments = useMemo(() => CareProgramService.getEnrollments(), [refreshKey]);
  const customers = StorageService.getStudents().filter((s) => s.status === 'active');
  const activePrograms = programs.filter((p) => p.isActive);
  const activeEnrollments = enrollments.filter((e) => e.status === 'active');

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((e) => {
      if (enrollFilter === 'active' && e.status !== 'active') return false;
      if (enrollFilter === 'completed' && e.status === 'active') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.customerName.toLowerCase().includes(q) ||
          e.programName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [enrollments, enrollFilter, searchQuery]);

  const openCreateProgram = () => {
    setEditingProgram(null);
    setProgramName('');
    setProgramSessions(10);
    setProgramPrice(500000);
    setProgramValidity(90);
    setProgramDesc('');
    setProgramModalOpen(true);
  };

  const openEditProgram = (p: CareProgram) => {
    setEditingProgram(p);
    setProgramName(p.name);
    setProgramSessions(p.totalSessions);
    setProgramPrice(p.price);
    setProgramValidity(p.validityDays || 90);
    setProgramDesc(p.description || '');
    setProgramModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programName.trim()) return;
    CareProgramService.saveProgram({
      id: editingProgram?.id,
      name: programName.trim(),
      totalSessions: programSessions,
      price: programPrice,
      validityDays: programValidity > 0 ? programValidity : undefined,
      description: programDesc.trim() || undefined,
      isActive: true,
    });
    showToast(editingProgram ? '프로그램이 수정되었습니다.' : '프로그램이 등록되었습니다.', 'success');
    setProgramModalOpen(false);
  };

  const handleDeleteProgram = (p: CareProgram) => {
    openConfirmDialog({
      title: '프로그램 삭제',
      message: `'${p.name}' 프로그램을 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제',
      onConfirm: () => {
        CareProgramService.deleteProgram(p.id);
        showToast('삭제되었습니다.', 'info');
      },
    });
  };

  const openEnroll = () => {
    setEnrollCustomerId(customers[0]?.id || '');
    setEnrollProgramId(activePrograms[0]?.id || '');
    setEnrollDate(new Date().toISOString().slice(0, 10));
    setEnrollModalOpen(true);
  };

  const handleEnroll = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === enrollCustomerId);
    if (!customer || !enrollProgramId) {
      showToast('고객과 프로그램을 선택해 주세요.', 'warning');
      return;
    }
    const saved = CareProgramService.enroll({
      customerId: customer.id,
      customerName: customer.name,
      programId: enrollProgramId,
      purchasedAt: enrollDate,
    });
    if (!saved) {
      showToast('프로그램 등록에 실패했습니다.', 'error');
      return;
    }

    // 수입 기록 연동 (선택적)
    StorageService.saveIncomeEntry({
      date: enrollDate,
      category: 'care_program',
      amount: saved.pricePaid,
      description: `${saved.programName} · ${saved.customerName}`,
      payer: saved.customerName,
      paymentMethod: 'transfer',
    });

    showToast(`${saved.customerName}님 케어 프로그램이 등록되었습니다.`, 'success');
    setEnrollModalOpen(false);
  };

  const handleUseSession = (enrollment: CareEnrollment) => {
    const updated = CareProgramService.useSession(enrollment.id);
    if (!updated) return;
    if (updated.status === 'completed') {
      showToast('모든 회차를 사용했습니다. 프로그램이 완료되었습니다.', 'success');
    } else {
      showToast(
        `회차 차감: ${updated.usedSessions}/${updated.totalSessions}회`,
        'info'
      );
    }
  };

  const handleCancelEnrollment = (enrollment: CareEnrollment) => {
    openConfirmDialog({
      title: '등록 취소',
      message: `${enrollment.customerName}님의 '${enrollment.programName}' 등록을 취소하시겠습니까?`,
      isDestructive: true,
      confirmText: '취소하기',
      onConfirm: () => {
        CareProgramService.cancelEnrollment(enrollment.id);
        showToast('등록이 취소되었습니다.', 'info');
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Ticket className="w-6 h-6" />}
        iconClassName="text-indigo-600"
        title="케어 프로그램"
        description="회차권·패키지 판매와 잔여 횟수 관리"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={openCreateProgram}
              className="px-4 py-2.5 min-h-[44px] bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl"
            >
              + 프로그램 정의
            </button>
            <button
              type="button"
              onClick={openEnroll}
              className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl"
            >
              + 고객 등록
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryMetricCard label="프로그램 종류" value={`${activePrograms.length}개`} />
        <SummaryMetricCard
          label="진행중 등록"
          value={`${activeEnrollments.length}건`}
          variant="indigo"
        />
        <SummaryMetricCard
          label="잔여 회차 합계"
          value={`${activeEnrollments.reduce((s, e) => s + (e.totalSessions - e.usedSessions), 0)}회`}
          variant="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 px-1">프로그램 목록</h3>
          {programs.length === 0 ? (
            <EmptyState
              icon={<Ticket className="w-10 h-10" />}
              title="정의된 프로그램이 없습니다"
              description="예: 수분케어 10회권"
              className="rounded-2xl p-6"
            />
          ) : (
            programs.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex justify-between gap-3"
              >
                <div>
                  <p className="font-bold text-slate-900 text-sm">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {p.totalSessions}회 · {formatCurrency(p.price)}
                    {p.validityDays ? ` · ${p.validityDays}일` : ''}
                  </p>
                  {p.description && (
                    <p className="text-[11px] text-slate-400 mt-1">{p.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => openEditProgram(p)}
                    className="text-xs font-bold text-indigo-600 min-h-[44px] px-2"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProgram(p)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <FilterTabs tabs={ENROLL_FILTERS} active={enrollFilter} onChange={setEnrollFilter} />
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="고객명·프로그램명 검색..."
              className="w-full"
            />
          </div>

          {filteredEnrollments.length === 0 ? (
            <EmptyState
              icon={<Ticket className="w-10 h-10" />}
              title="등록된 고객 프로그램이 없습니다"
              description="고객에게 회차권을 판매·등록하세요"
              className="rounded-2xl p-8"
            />
          ) : (
            filteredEnrollments.map((e) => {
              const remaining = e.totalSessions - e.usedSessions;
              const pct = Math.min(100, Math.round((e.usedSessions / e.totalSessions) * 100));
              return (
                <div
                  key={e.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-slate-900">{e.customerName}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            e.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : e.status === 'completed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {STATUS_LABEL[e.status]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {e.programName} · 구매일 {e.purchasedAt}
                        {e.expiresAt ? ` · ~${e.expiresAt}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-black text-indigo-700 shrink-0">
                      {remaining}/{e.totalSessions}회
                    </p>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {e.status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleUseSession(e)}
                        className="flex-1 min-h-[44px] flex items-center justify-center gap-1.5 text-xs font-bold bg-indigo-600 text-white rounded-xl"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        회차 차감
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelEnrollment(e)}
                        className="min-h-[44px] px-3 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <Modal
        isOpen={programModalOpen}
        onClose={() => setProgramModalOpen(false)}
        title={editingProgram ? '프로그램 수정' : '프로그램 정의'}
      >
        <form onSubmit={handleSaveProgram} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">프로그램명 *</label>
            <input
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              placeholder="예: 수분케어 10회권"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">총 회차</label>
              <input
                type="number"
                min={1}
                value={programSessions}
                onChange={(e) => setProgramSessions(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">판매가</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={programPrice}
                onChange={(e) => setProgramPrice(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">유효 기간(일)</label>
            <input
              type="number"
              min={0}
              value={programValidity}
              onChange={(e) => setProgramValidity(Number(e.target.value))}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              placeholder="0 = 무기한"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">설명</label>
            <textarea
              value={programDesc}
              onChange={(e) => setProgramDesc(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border rounded-xl resize-none"
              placeholder="포함 시술, 주의사항 등"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl text-sm"
          >
            저장
          </button>
        </form>
      </Modal>

      <Modal isOpen={enrollModalOpen} onClose={() => setEnrollModalOpen(false)} title="고객 프로그램 등록">
        <form onSubmit={handleEnroll} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">고객 *</label>
            <select
              value={enrollCustomerId}
              onChange={(e) => setEnrollCustomerId(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              required
            >
              <option value="">선택</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">프로그램 *</label>
            <select
              value={enrollProgramId}
              onChange={(e) => setEnrollProgramId(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              required
            >
              <option value="">선택</option>
              {activePrograms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.totalSessions}회 · {formatCurrency(p.price)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">구매일</label>
            <input
              type="date"
              value={enrollDate}
              onChange={(e) => setEnrollDate(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            등록
          </button>
        </form>
      </Modal>
    </div>
  );
};
