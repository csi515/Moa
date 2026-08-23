import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import type { ServiceCategory, ServiceOffering } from '@/core/types/schedule';
import { EmptyState, Modal, PageHeader } from '@/shared/components';
import { formatCurrency } from '@/utils/formatters';
import { Sparkles, Trash2 } from 'lucide-react';

const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  private: '1:1 관리',
  group: '그룹',
  reformer: '기기',
  facial: '페이셜',
  body: '바디',
  package: '패키지',
  other: '기타',
};

export const TreatmentMenuView: React.FC = () => {
  const { showToast, openConfirmDialog } = useApp();
  useStorageRefresh();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOffering | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(80000);
  const [duration, setDuration] = useState(60);
  const [capacity, setCapacity] = useState(1);
  const [category, setCategory] = useState<ServiceCategory>('facial');

  const offerings = ScheduleService.getServiceOfferings();

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPrice(80000);
    setDuration(60);
    setCapacity(1);
    setCategory('facial');
    setIsModalOpen(true);
  };

  const openEdit = (o: ServiceOffering) => {
    setEditing(o);
    setName(o.name);
    setPrice(o.price);
    setDuration(o.durationMinutes);
    setCapacity(o.maxCapacity);
    setCategory(o.category);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    ScheduleService.saveServiceOffering({
      id: editing?.id,
      name: name.trim(),
      price,
      durationMinutes: duration,
      maxCapacity: capacity,
      category,
      isActive: true,
      isSchedulable: true,
    });

    showToast(editing ? '시술 메뉴가 수정되었습니다.' : '시술 메뉴가 등록되었습니다.', 'success');
    setIsModalOpen(false);
  };

  const handleDelete = (o: ServiceOffering) => {
    openConfirmDialog({
      title: '시술 메뉴 삭제',
      message: `'${o.name}' 시술을 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제',
      onConfirm: () => {
        ScheduleService.deleteServiceOffering(o.id);
        showToast('삭제되었습니다.', 'info');
      },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Sparkles className="w-6 h-6" />}
        iconClassName="text-rose-600"
        title="시술 메뉴"
        description="페이셜·바디·기기 관리 메뉴와 시간·요금을 설정합니다"
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl"
          >
            + 시술 추가
          </button>
        }
      />

      {offerings.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="w-10 h-10" />}
          title="등록된 시술 메뉴가 없습니다"
          description="예약 전 시술 메뉴를 먼저 등록해 주세요"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {offerings.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                    {CATEGORY_LABEL[o.category] || o.category}
                  </span>
                  <p className="font-bold text-slate-900 mt-2">{o.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {o.durationMinutes}분 · {formatCurrency(o.price)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(o)}
                    className="text-xs font-bold text-rose-600 px-2 min-h-[44px]"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(o)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? '시술 메뉴 수정' : '시술 메뉴 등록'}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">시술명 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              placeholder="예: 수분 집중 케어 60분"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">시간(분)</label>
              <input
                type="number"
                min={15}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">요금</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">분류</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
            >
              <option value="facial">페이셜</option>
              <option value="body">바디</option>
              <option value="private">1:1 관리</option>
              <option value="package">패키지</option>
              <option value="reformer">기기</option>
              <option value="other">기타</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 min-h-[44px] bg-rose-600 text-white font-bold rounded-xl text-sm"
          >
            저장
          </button>
        </form>
      </Modal>
    </div>
  );
};
