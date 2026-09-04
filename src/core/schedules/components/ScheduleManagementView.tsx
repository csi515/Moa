import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { coreScheduleService } from '@/core/schedules';
import type { CoreSchedule, ScheduleFormData } from '@/types';
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Clock,
  Users,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
} from 'lucide-react';

export const ScheduleManagementView: React.FC = () => {
  const { showToast, openConfirmDialog } = useApp();
  const { currentOrganization } = useOrganization();
  
  const [schedules, setSchedules] = useState<CoreSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CoreSchedule | null>(null);
  
  const [filterType, setFilterType] = useState<'all' | 'bookable' | 'regular'>('all');
  const [dateFilter, setDateFilter] = useState<string>('upcoming'); // 'upcoming' | 'all'

  const [formData, setFormData] = useState<ScheduleFormData>({
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    is_bookable: false,
    max_capacity: 1,
    service_id: undefined,
    staff_id: undefined,
    memo: '',
  });

  useEffect(() => {
    if (currentOrganization) {
      loadSchedules();
    }
  }, [currentOrganization]);

  const loadSchedules = async () => {
    if (!currentOrganization) return;
    
    try {
      setLoading(true);
      const fromDate = dateFilter === 'upcoming' ? new Date().toISOString() : undefined;
      const data = await coreScheduleService.getOrganizationSchedules(
        currentOrganization.id,
        fromDate
      );
      setSchedules(data);
    } catch (err) {
      showToast('일정을 불러오는데 실패했습니다.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter((schedule) => {
    if (filterType === 'bookable' && !schedule.is_bookable) return false;
    if (filterType === 'regular' && schedule.is_bookable) return false;
    return true;
  });

  const handleOpenCreate = () => {
    setEditingSchedule(null);
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 내일
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1시간 후

    setFormData({
      title: '',
      description: '',
      starts_at: startTime.toISOString().slice(0, 16),
      ends_at: endTime.toISOString().slice(0, 16),
      is_bookable: false,
      max_capacity: 1,
      service_id: undefined,
      staff_id: undefined,
      memo: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (schedule: CoreSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      title: schedule.title || '',
      description: schedule.description || '',
      starts_at: new Date(schedule.starts_at).toISOString().slice(0, 16),
      ends_at: new Date(schedule.ends_at).toISOString().slice(0, 16),
      is_bookable: schedule.is_bookable,
      max_capacity: schedule.max_capacity,
      service_id: schedule.service_id || undefined,
      staff_id: schedule.staff_id || undefined,
      memo: schedule.memo || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrganization) return;

    if (!formData.title.trim()) {
      showToast('일정 제목을 입력해주세요.', 'warning');
      return;
    }

    const startsAt = new Date(formData.starts_at);
    const endsAt = new Date(formData.ends_at);

    if (endsAt <= startsAt) {
      showToast('종료 시간은 시작 시간 이후여야 합니다.', 'warning');
      return;
    }

    try {
      if (editingSchedule) {
        await coreScheduleService.updateSchedule(editingSchedule.id, formData);
        showToast('일정이 수정되었습니다.', 'success');
      } else {
        await coreScheduleService.createSchedule(currentOrganization.id, formData);
        showToast('일정이 등록되었습니다.', 'success');
      }
      setIsModalOpen(false);
      loadSchedules();
    } catch (err) {
      showToast(
        editingSchedule ? '일정 수정에 실패했습니다.' : '일정 등록에 실패했습니다.',
        'error'
      );
      console.error(err);
    }
  };

  const handleDelete = (schedule: CoreSchedule) => {
    openConfirmDialog({
      title: '일정 삭제',
      message: `'${schedule.title}' 일정을 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: async () => {
        try {
          await coreScheduleService.deleteSchedule(schedule.id);
          showToast('일정이 삭제되었습니다.', 'info');
          loadSchedules();
        } catch (err) {
          showToast('일정 삭제에 실패했습니다.', 'error');
          console.error(err);
        }
      },
    });
  };

  const handleToggleBookable = async (schedule: CoreSchedule) => {
    try {
      await coreScheduleService.toggleBookable(schedule.id, !schedule.is_bookable);
      showToast(
        schedule.is_bookable ? '예약 기능이 비활성화되었습니다.' : '예약 기능이 활성화되었습니다.',
        'success'
      );
      loadSchedules();
    } catch (err) {
      showToast('예약 설정 변경에 실패했습니다.', 'error');
      console.error(err);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-sm text-slate-600">일정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            일정 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            조직의 일정 및 예약 가능한 슬롯을 관리합니다.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          일정 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {['all', 'bookable', 'regular'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type as typeof filterType)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filterType === type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {type === 'all' && '전체'}
              {type === 'bookable' && '예약 가능'}
              {type === 'regular' && '일반 일정'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {['upcoming', 'all'].map((filter) => (
            <button
              key={filter}
              onClick={() => {
                setDateFilter(filter);
                loadSchedules();
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                dateFilter === filter
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter === 'upcoming' && '향후 일정'}
              {filter === 'all' && '모든 일정'}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule List */}
      {filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">등록된 일정이 없습니다</p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
          >
            첫 일정 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                          {schedule.title || '(제목 없음)'}
                        </h3>
                        {schedule.is_bookable && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            예약가능
                          </span>
                        )}
                      </div>
                      {schedule.description && (
                        <p className="text-sm text-slate-600 mb-3">{schedule.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(schedule.starts_at)}</span>
                          <span>~</span>
                          <span>{new Date(schedule.ends_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {schedule.is_bookable && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>최대 {schedule.max_capacity}명</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleBookable(schedule)}
                    className={`p-2 rounded-lg transition-colors ${
                      schedule.is_bookable
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-slate-400 hover:bg-slate-100'
                    }`}
                    title={schedule.is_bookable ? '예약 비활성화' : '예약 활성화'}
                  >
                    {schedule.is_bookable ? (
                      <ToggleRight className="w-6 h-6" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(schedule)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(schedule)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingSchedule ? '일정 수정' : '일정 등록'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    일정 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예: 무료 체험 레슨, 상담 슬롯, 그룹 수업"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="일정에 대한 상세 설명을 입력하세요."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      시작 시간 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      종료 시간 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_bookable"
                      checked={formData.is_bookable}
                      onChange={(e) => setFormData({ ...formData, is_bookable: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                    />
                    <label htmlFor="is_bookable" className="text-sm font-semibold text-slate-900">
                      고객 예약 가능 (공개)
                    </label>
                  </div>
                  
                  {formData.is_bookable && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        최대 수용 인원 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.max_capacity}
                        onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        개인 예약: 1명, 그룹 예약: 2명 이상
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    메모
                  </label>
                  <textarea
                    value={formData.memo}
                    onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                    rows={2}
                    placeholder="내부 메모 (고객에게 보이지 않음)"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editingSchedule ? '수정하기' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
