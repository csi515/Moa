import React, { useMemo, useState } from 'react';
import { Award, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Achievement, AchievementType } from '@/types/education';
import type { AcademyEvent } from '@/types';
import { StorageService } from '@/services/storage';

const ACHIEVEMENT_TYPE_LABEL: Record<AchievementType, string> = {
  exam: '시험/급수',
  competition: '콩쿠르',
  certificate: '자격증',
  grade: '등급',
  recital: '연주회',
  other: '기타',
};

const EMPTY_FORM = {
  title: '',
  result: '',
  levelLabel: '',
  songTitle: '',
  eventDate: new Date().toISOString().slice(0, 10),
  memo: '',
  certificateUrl: '',
  eventId: '',
};

interface StudentDetailAchievementsTabProps {
  studentId: string;
  competitionEvents: AcademyEvent[];
  showToast: (message: string, type?: 'success' | 'warning' | 'info') => void;
  openConfirmDialog: (options: {
    title: string;
    message: string;
    isDestructive?: boolean;
    confirmText?: string;
    onConfirm: () => void;
  }) => void;
}

export const StudentDetailAchievementsTab: React.FC<StudentDetailAchievementsTabProps> = ({
  studentId,
  competitionEvents,
  showToast,
  openConfirmDialog,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [refreshKey, setRefreshKey] = useState(0);

  const achievements = useMemo(
    () =>
      StorageService.getAchievements(studentId)
        .filter((a) => a.type === 'competition')
        .sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || '')),
    [studentId, refreshKey]
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const handleEventChange = (eventId: string) => {
    setForm((prev) => ({ ...prev, eventId }));
    if (!eventId) return;
    const ev = competitionEvents.find((item) => item.id === eventId);
    if (!ev) return;
    setForm((prev) => ({
      ...prev,
      eventId,
      title: prev.title.trim() ? prev.title : ev.title,
      eventDate: ev.startDate,
    }));
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingId(achievement.id);
    setForm({
      title: achievement.title,
      result: achievement.result || '',
      levelLabel: achievement.levelLabel || '',
      songTitle: achievement.songTitle || '',
      eventDate: achievement.eventDate || new Date().toISOString().slice(0, 10),
      memo: achievement.memo || '',
      certificateUrl: achievement.certificateUrl || '',
      eventId: achievement.eventId || '',
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      showToast('콩쿠르명을 입력해 주세요.', 'warning');
      return;
    }

    const linkedEvent = form.eventId
      ? competitionEvents.find((ev) => ev.id === form.eventId)
      : undefined;

    StorageService.saveAchievement({
      id: editingId || undefined,
      studentId,
      type: 'competition',
      title: form.title.trim(),
      result: form.result.trim() || undefined,
      levelLabel: form.levelLabel.trim() || undefined,
      songTitle: form.songTitle.trim() || undefined,
      eventDate: form.eventDate || undefined,
      memo: form.memo.trim() || undefined,
      certificateUrl: form.certificateUrl.trim() || undefined,
      eventId: linkedEvent?.id,
      eventTitle: linkedEvent?.title,
    });

    showToast(editingId ? '수상 이력이 수정되었습니다.' : '수상 이력이 등록되었습니다.', 'success');
    setRefreshKey((k) => k + 1);
    resetForm();
  };

  const handleDelete = (achievement: Achievement) => {
    openConfirmDialog({
      title: '수상 이력 삭제',
      message: `'${achievement.title}' 수상 기록을 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deleteAchievement(achievement.id);
        showToast('수상 이력이 삭제되었습니다.', 'info');
        setRefreshKey((k) => k + 1);
        if (editingId === achievement.id) resetForm();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">콩쿨 수상 이력</h4>
          <p className="text-xs text-slate-500">대회명, 부문, 연주곡, 수상 등급을 기록합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            setForm(EMPTY_FORM);
            setIsFormOpen(true);
          }}
          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5" />
          수상 등록
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
          <h5 className="text-xs font-bold text-amber-900">
            {editingId ? '수상 이력 수정' : '새 수상 이력'}
          </h5>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">학원 콩쿠르 일정 (선택)</label>
              <select
                value={form.eventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              >
                <option value="">직접 입력</option>
                {competitionEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.startDate})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">콩쿠르명</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="예: 전국 소년소녀 피아노 콩쿠르"
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">대회일</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">수상 결과</label>
              <input
                type="text"
                value={form.result}
                onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}
                placeholder="예: 금상, 최우수상, 입상"
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">부문/연령</label>
              <input
                type="text"
                value={form.levelLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, levelLabel: e.target.value }))}
                placeholder="예: 초등 저학년부"
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">연주곡</label>
              <input
                type="text"
                value={form.songTitle}
                onChange={(e) => setForm((prev) => ({ ...prev, songTitle: e.target.value }))}
                placeholder="예: 쇼팽 왈츠 Op.64-2"
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">상장/인증서 링크 (선택)</label>
              <input
                type="url"
                value={form.certificateUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, certificateUrl: e.target.value }))}
                placeholder="https://"
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">메모</label>
              <textarea
                value={form.memo}
                onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="심사 코멘트, 준비 과정 등"
                rows={2}
                className="w-full px-2.5 py-2 text-xs bg-white border border-slate-200 rounded-lg resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-lg min-h-[44px]"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700 min-h-[44px]"
            >
              저장
            </button>
          </div>
        </form>
      )}

      {achievements.length === 0 ? (
        <p className="text-xs text-slate-500 p-6 text-center bg-slate-50 rounded-2xl">
          등록된 콩쿨 수상 이력이 없습니다.
        </p>
      ) : (
        <div className="space-y-2">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{achievement.title}</p>
                    <p className="text-amber-700 font-bold mt-0.5">
                      {achievement.result || '수상'}
                      {achievement.levelLabel ? ` · ${achievement.levelLabel}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(achievement)}
                    className="p-2 rounded-lg hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="수상 이력 수정"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(achievement)}
                    className="p-2 rounded-lg hover:bg-rose-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="수상 이력 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600">
                <p>대회일: {achievement.eventDate || '-'}</p>
                <p>유형: {ACHIEVEMENT_TYPE_LABEL[achievement.type]}</p>
                {achievement.songTitle && <p className="sm:col-span-2">연주곡: {achievement.songTitle}</p>}
                {achievement.eventTitle && (
                  <p className="sm:col-span-2 text-indigo-600">학원 일정: {achievement.eventTitle}</p>
                )}
                {achievement.memo && <p className="sm:col-span-2 text-slate-500">메모: {achievement.memo}</p>}
              </div>

              {achievement.certificateUrl && (
                <a
                  href={achievement.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-[11px] font-bold text-indigo-600 hover:underline"
                >
                  상장/인증서 보기
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
