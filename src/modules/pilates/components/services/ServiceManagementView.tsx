import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { ScheduleService } from '@/core/services/scheduleService';
import type { ServiceOffering } from '@/core/types/schedule';
import { EmptyState, Modal, PageHeader } from '@/shared/components';
import { formatCurrency } from '@/utils/formatters';
import { Dumbbell, Trash2 } from 'lucide-react';

const CATEGORY_LABEL: Record<ServiceOffering['category'], string> = {
  private: '개인',
  group: '그룹',
  reformer: '기구',
  other: '기타',
};

export const ServiceManagementView: React.FC = () => {
  const { showToast, openConfirmDialog } = useApp();
  useStorageRefresh();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceOffering | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState(80000);
  const [duration, setDuration] = useState(50);
  const [capacity, setCapacity] = useState(1);
  const [category, setCategory] = useState<ServiceOffering['category']>('private');

  const offerings = ScheduleService.getServiceOfferings();

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPrice(80000);
    setDuration(50);
    setCapacity(1);
    setCategory('private');
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

    showToast(editing ? '수업 종류가 수정되었습니다.' : '수업 종류가 등록되었습니다.', 'success');
    setIsModalOpen(false);
  };

  const handleDelete = (o: ServiceOffering) => {
    openConfirmDialog({
      title: '수업 종류 삭제',
      message: `'${o.name}' 수업 종류를 삭제하시겠습니까?`,
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
        icon={<Dumbbell className="w-6 h-6" />}
        iconClassName="text-purple-600"
        title="수업 종류 관리"
        description="개인·그룹·기구 필라테스 수업 종류와 시간·요금을 설정합니다"
        actions={
          <button onClick={openCreate} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl">
            + 수업 추가
          </button>
        }
      />

      {offerings.length === 0 ? (
        <EmptyState icon={<Dumbbell className="w-10 h-10" />} title="등록된 수업 종류가 없습니다" description="예약 전 수업 종류를 먼저 등록해 주세요" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {offerings.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                    {CATEGORY_LABEL[o.category]}
                  </span>
                  <p className="font-bold text-slate-900 mt-2">{o.name}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {o.durationMinutes}분 · 정원 {o.maxCapacity}명 · {formatCurrency(o.price)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(o)} className="text-xs font-bold text-teal-600 px-2 py-1">수정</button>
                  <button onClick={() => handleDelete(o)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? '수업 종류 수정' : '수업 종류 등록'}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">수업명 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border rounded-xl" placeholder="개인 레슨 50분" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">시간(분)</label>
              <input type="number" min={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full px-3 py-2 text-sm border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">정원</label>
              <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-3 py-2 text-sm border rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">요금</label>
              <input type="number" min={0} step={1000} value={price} onChange={(e) => setPrice(Number(e.target.value))} className="w-full px-3 py-2 text-sm border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">분류</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ServiceOffering['category'])} className="w-full px-3 py-2 text-sm border rounded-xl">
                <option value="private">개인</option>
                <option value="group">그룹</option>
                <option value="reformer">기구</option>
                <option value="other">기타</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 bg-purple-600 text-white font-bold rounded-xl text-sm">저장</button>
        </form>
      </Modal>
    </div>
  );
};
