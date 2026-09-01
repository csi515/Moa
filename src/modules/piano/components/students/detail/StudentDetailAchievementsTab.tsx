import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const INPUT_CLASS =
  'w-full px-3 py-3 text-sm bg-white border border-slate-200 rounded-xl min-h-[44px] focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-400';

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
  const formRef = useRef<HTMLFormElement>(null);

  const achievements = useMemo(
    () =>
      StorageService.getAchievements(studentId)
        .filter((a) => a.type === 'competition')
        .sort((a, b) => (b.eventDate || '').localeCompare(a.eventDate || '')),
    [studentId, refreshKey]
  );

  useEffect(() => {
    if (!isFormOpen) return;
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [isFormOpen, editingId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsFormOpen(true);
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
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h4 className="text-sm sm:text-base font-bold text-slate-900">콩쿨 수상 이력</h4>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            대회명, 부문, 연주곡, 수상 등급을 기록합니다.
          </p>
        </div>
        {!isFormOpen && (
          <button
            type="button"
            onClick={openCreateForm}
            className="w-full sm:w-auto shrink-0 px-4 py-3 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            수상 등록
          </button>
        )}
      </div>

      {isFormOpen && (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="p-4 sm:p-5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <h5 className="text-sm font-bold text-amber-900">
              {editingId ? '수상 이력 수정' : '새 수상 이력'}
            </h5>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                학원 콩쿠르 일정 (선택)
              </label>
              <select
                value={form.eventId}
                onChange={(e) => handleEventChange(e.target.value)}
                className={INPUT_CLASS}
              >
                <option value="">직접 입력</option>
                {competitionEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.startDate})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">콩쿠르명 *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="예: 전국 소년소녀 피아노 콩쿠르"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">대회일</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => setForm((prev) => ({ ...prev, eventDate: e.target.value }))}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">수상 결과</label>
              <input
                type="text"
                value={form.result}
                onChange={(e) => setForm((prev) => ({ ...prev, result: e.target.value }))}
                placeholder="예: 금상, 최우수상, 입상"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">부문/연령</label>
              <input
                type="text"
                value={form.levelLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, levelLabel: e.target.value }))}
                placeholder="예: 초등 저학년부"
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">연주곡</label>
              <input
                type="text"
                value={form.songTitle}
                onChange={(e) => setForm((prev) => ({ ...prev, songTitle: e.target.value }))}
                placeholder="예: 쇼팽 왈츠 Op.64-2"
                className={INPUT_CLASS}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                상장/인증서 링크 (선택)
              </label>
              <input
                type="url"
                inputMode="url"
                value={form.certificateUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, certificateUrl: e.target.value }))}
                placeholder="https://"
                className={INPUT_CLASS}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">메모</label>
              <textarea
                value={form.memo}
                onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
                placeholder="심사 코멘트, 준비 과정 등"
                rows={3}
                className={`${INPUT_CLASS} min-h-[88px] py-3 resize-y`}
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-4 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl min-h-[44px]"
            >
              취소
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-3 text-sm font-bold text-white bg-amber-600 rounded-xl hover:bg-amber-700 active:bg-amber-800 min-h-[44px]"
            >
              저장
            </button>
          </div>
        </form>
      )}

      {achievements.length === 0 ? (
        <div className="p-8 sm:p-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">등록된 콩쿨 수상 이력이 없습니다.</p>
          {!isFormOpen && (
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 px-4 py-2.5 text-sm font-bold text-amber-700 bg-amber-50 rounded-xl min-h-[44px]"
            >
              첫 수상 기록 등록하기
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <article
              key={achievement.id}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 flex flex-col gap-3 h-full"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-sm sm:text-base break-words leading-snug">
                    {achievement.title}
                  </p>
                  <p className="text-amber-700 font-bold text-sm mt-1 break-words">
                    {achievement.result || '수상'}
                    {achievement.levelLabel ? ` · ${achievement.levelLabel}` : ''}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600">
                <div>
                  <dt className="text-slate-400 text-[11px] sm:text-xs">대회일</dt>
                  <dd className="font-medium">{achievement.eventDate || '-'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400 text-[11px] sm:text-xs">유형</dt>
                  <dd className="font-medium">{ACHIEVEMENT_TYPE_LABEL[achievement.type]}</dd>
                </div>
                {achievement.songTitle && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-400 text-[11px] sm:text-xs">연주곡</dt>
                    <dd className="font-medium break-words">{achievement.songTitle}</dd>
                  </div>
                )}
                {achievement.eventTitle && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-400 text-[11px] sm:text-xs">학원 일정</dt>
                    <dd className="font-medium text-indigo-600 break-words">{achievement.eventTitle}</dd>
                  </div>
                )}
                {achievement.memo && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-400 text-[11px] sm:text-xs">메모</dt>
                    <dd className="text-slate-500 break-words whitespace-pre-wrap">{achievement.memo}</dd>
                  </div>
                )}
              </dl>

              {achievement.certificateUrl && (
                <a
                  href={achievement.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center sm:justify-start text-sm font-bold text-indigo-600 hover:underline min-h-[44px]"
                >
                  상장/인증서 보기
                </a>
              )}

              <div className="flex gap-2 pt-2 mt-auto border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleEdit(achievement)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  <Pencil className="w-4 h-4" />
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(achievement)}
                  className="flex-1 py-2.5 rounded-xl border border-rose-200 text-sm font-bold text-rose-600 hover:bg-rose-50 min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
