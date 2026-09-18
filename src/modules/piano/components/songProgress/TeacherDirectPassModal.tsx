import { useState, type FC, type FormEvent } from 'react';
import { Loader2, Share2, Stamp } from 'lucide-react';
import { Modal } from '@/shared/components';
import { FormField, FORM_CONTROL_CLASS } from '@/shared/components/ui';
import { songProgressService } from './songProgressService';
import { fireSongCompletionConfetti, shareSongCelebration } from './songProgressEffects';
import { SONG_BOOK_OPTIONS, SONG_PROGRESS_COPY } from './songProgressTypes';

interface TeacherDirectPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  customerId: string;
  studentName: string;
  onToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  onGranted?: () => void;
}

/** 원장/강사 — 레슨 중 완곡 스탬프 즉시 수여 */
export const TeacherDirectPassModal: FC<TeacherDirectPassModalProps> = ({
  isOpen,
  onClose,
  organizationId,
  customerId,
  studentName,
  onToast,
  onGranted,
}) => {
  const [bookName, setBookName] = useState<string>(SONG_BOOK_OPTIONS[4] || SONG_BOOK_OPTIONS[0]);
  const [songTitle, setSongTitle] = useState('');
  const [stamps, setStamps] = useState(1);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ bookName: string; songTitle: string; stamps: number } | null>(
    null
  );

  const resetForm = () => {
    setSongTitle('');
    setStamps(1);
    setDone(null);
  };

  const handleClose = () => {
    if (saving) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim()) {
      onToast?.('곡명·번호를 입력해 주세요.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await songProgressService.grantDirect({
        organizationId,
        customerId,
        bookName,
        songTitle: songTitle.trim(),
        stamps,
      });
      fireSongCompletionConfetti();
      setDone({ bookName, songTitle: songTitle.trim(), stamps });
      onToast?.(`${studentName} 학생에게 스탬프를 수여했습니다.`, 'success');
      onGranted?.();
    } catch (err) {
      onToast?.(err instanceof Error ? err.message : '수여 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (!done) return;
    const result = await shareSongCelebration({
      studentName,
      bookName: done.bookName,
      songTitle: done.songTitle,
      stampCount: done.stamps,
      teacherGrant: true,
    });
    if (result === 'shared') onToast?.('공유했습니다.', 'success');
    else if (result === 'copied') onToast?.('축하 문구를 복사했습니다. 카톡에 붙여넣어 주세요.', 'info');
    else onToast?.('이 기기에서는 공유를 지원하지 않습니다.', 'warning');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${SONG_PROGRESS_COPY.grantCta} · ${studentName}`}
      maxWidth="md"
    >
      <div className="p-4 sm:p-5 space-y-4">
        {done ? (
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-800">
              <Stamp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-black text-slate-900">스탬프 수여 완료!</p>
              <p className="text-sm text-slate-600 mt-1">
                {done.bookName} · {done.songTitle} (+{done.stamps})
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 hover:bg-indigo-700"
            >
              <Share2 className="w-4 h-4" />
              {SONG_PROGRESS_COPY.shareParentCta}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full min-h-[44px] rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
            >
              닫기
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              레슨 중 연주를 확인한 뒤 즉시 스탬프를 발급합니다. 학부모 폰(PWA)에 실시간으로 반영됩니다.
            </p>
            <FormField label="교재" required>
              <select
                className={FORM_CONTROL_CLASS}
                value={bookName}
                onChange={(e) => setBookName(e.target.value)}
              >
                {SONG_BOOK_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="곡명 / 번호" required>
              <input
                className={FORM_CONTROL_CLASS}
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="예: No. 5"
                maxLength={100}
                required
              />
            </FormField>
            <FormField label="스탬프 개수">
              <select
                className={FORM_CONTROL_CLASS}
                value={stamps}
                onChange={(e) => setStamps(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}개
                  </option>
                ))}
              </select>
            </FormField>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="flex-1 min-h-[48px] rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[1.4] min-h-[48px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Stamp className="w-4 h-4" />}
                스탬프 수여
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
