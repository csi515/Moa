import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { PageHeader, FilterBar } from '@/shared/components';
import {
  getAcademySubjectLabel,
  getAcademySubjectOptions,
} from '@/modules/academy/config/subjects';
import { ClipboardList, Plus, Trash2, X } from 'lucide-react';

/** 종합학원 시험·점수 기록 */
export const ExamManagementView: React.FC = () => {
  const { showToast, triggerRefresh, currentUser } = useApp();
  const { scopeStudents } = useStaffScope();
  const refreshKey = useStorageRefresh();

  const settings = StorageService.getSettings();
  const subjectOptions = getAcademySubjectOptions(settings);
  const classes = StorageService.getClasses();
  const students = scopeStudents(
    StorageService.getStudents().filter((s) => s.status === 'active')
  );

  const exams = useMemo(() => StorageService.getAcademyExams(), [refreshKey]);
  const allScores = useMemo(() => StorageService.getAcademyExamScores(), [refreshKey]);

  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
  const [showCreate, setShowCreate] = useState(false);
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    subject: subjectOptions[0]?.label || '국어',
    examDate: new Date().toISOString().slice(0, 10),
    maxScore: 100,
    classId: '',
    memo: '',
  });

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const scoresForExam = selectedExam
    ? allScores.filter((s) => s.examId === selectedExam.id)
    : [];

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const examStats = useMemo(() => {
    const numeric = scoresForExam.filter((s) => s.score != null).map((s) => s.score as number);
    if (numeric.length === 0) return { avg: null, count: 0, max: selectedExam?.maxScore ?? 100 };
    const avg = Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10;
    return { avg, count: numeric.length, max: selectedExam?.maxScore ?? 100 };
  }, [scoresForExam, selectedExam]);

  React.useEffect(() => {
    if (!selectedExam) {
      setDraftScores({});
      return;
    }
    const next: Record<string, string> = {};
    for (const row of scoresForExam) {
      next[row.studentId] = row.score == null ? '' : String(row.score);
    }
    setDraftScores(next);
  }, [selectedExamId, refreshKey]);

  const handleCreate = () => {
    if (!form.title.trim()) {
      showToast('시험 이름을 입력해 주세요.', 'warning');
      return;
    }
    let targets = students;
    if (form.classId) {
      targets = students.filter((s) => s.classIds?.includes(form.classId));
    }
    if (targets.length === 0) {
      showToast('점수를 기록할 재원생이 없습니다.', 'warning');
      return;
    }
    const created = StorageService.createAcademyExamWithScores({
      title: form.title.trim(),
      subject: form.subject,
      examDate: form.examDate,
      maxScore: form.maxScore,
      classId: form.classId || undefined,
      memo: form.memo.trim() || undefined,
      staffId: currentUser.staffId || undefined,
      students: targets,
    });
    setSelectedExamId(created.id);
    setShowCreate(false);
    setForm((prev) => ({ ...prev, title: '', memo: '' }));
    showToast(`시험이 등록되었습니다 (${targets.length}명).`, 'success');
    triggerRefresh();
  };

  const saveScores = () => {
    if (!selectedExam) return;
    for (const row of scoresForExam) {
      const raw = draftScores[row.studentId]?.trim();
      const score = raw === '' ? null : Math.min(selectedExam.maxScore, Math.max(0, Number(raw)));
      StorageService.saveAcademyExamScore({
        id: row.id,
        examId: row.examId,
        studentId: row.studentId,
        score: raw === '' || Number.isNaN(score) ? null : score,
      });
    }
    showToast('점수가 저장되었습니다.', 'success');
    triggerRefresh();
  };

  const handleDeleteExam = () => {
    if (!selectedExam) return;
    StorageService.deleteAcademyExam(selectedExam.id);
    setSelectedExamId(exams.find((e) => e.id !== selectedExam.id)?.id || '');
    showToast('시험이 삭제되었습니다.', 'info');
    triggerRefresh();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<ClipboardList className="w-6 h-6" />}
        title="시험·점수 관리"
        description="시험을 등록하고 원생별 점수를 기록합니다"
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            시험 등록
          </button>
        }
      />

      <FilterBar>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold"
        >
          {exams.length === 0 && <option value="">등록된 시험 없음</option>}
          {exams.map((e) => (
            <option key={e.id} value={e.id}>
              {e.examDate} · {getAcademySubjectLabel(e.subject)} · {e.title}
            </option>
          ))}
        </select>
        {selectedExam && (
          <button
            type="button"
            onClick={handleDeleteExam}
            className="px-3 py-2 min-h-[44px] min-w-[44px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center"
            aria-label="시험 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </FilterBar>

      {selectedExam ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {getAcademySubjectLabel(selectedExam.subject)}
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedExam.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  시험일 {selectedExam.examDate} · 만점 {selectedExam.maxScore}점
                </p>
                {selectedExam.memo && (
                  <p className="text-sm text-slate-600 mt-2">{selectedExam.memo}</p>
                )}
              </div>
              {examStats.avg != null && (
                <div className="text-right">
                  <p className="text-xs text-slate-500">평균 ({examStats.count}명)</p>
                  <p className="text-2xl font-extrabold text-indigo-700">
                    {examStats.avg}
                    <span className="text-sm font-bold text-slate-400">/{examStats.max}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[1fr_120px] gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <span>원생</span>
              <span>점수</span>
            </div>
            <div className="divide-y divide-slate-100">
              {scoresForExam.map((row) => {
                const student = studentMap.get(row.studentId);
                if (!student) return null;
                return (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.grade || student.level}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={selectedExam.maxScore}
                        placeholder="미응시"
                        value={draftScores[row.studentId] ?? ''}
                        onChange={(e) =>
                          setDraftScores((prev) => ({
                            ...prev,
                            [row.studentId]: e.target.value,
                          }))
                        }
                        className="w-full sm:w-28 px-3 py-2 min-h-[44px] text-sm font-bold text-center border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-400 shrink-0">/ {selectedExam.maxScore}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={saveScores}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl"
              >
                점수 저장
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">등록된 시험이 없습니다</p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2.5 min-h-[44px] text-sm font-bold text-indigo-600 hover:underline"
          >
            첫 시험 등록하기
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-slate-900">시험 등록</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">과목</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
                >
                  {subjectOptions.map((s) => (
                    <option key={s.id} value={s.label}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  시험명 <span className="text-rose-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="예: 1학기 중간고사"
                  className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">시험일</label>
                  <input
                    type="date"
                    value={form.examDate}
                    onChange={(e) => setForm({ ...form, examDate: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">만점</label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={form.maxScore}
                    onChange={(e) => setForm({ ...form, maxScore: Number(e.target.value) || 100 })}
                    className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">대상</label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
                >
                  <option value="">재원생 전체</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">메모</label>
                <textarea
                  rows={2}
                  value={form.memo}
                  onChange={(e) => setForm({ ...form, memo: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none"
                />
              </div>
              <button
                type="button"
                onClick={handleCreate}
                className="w-full py-3 min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl"
              >
                시험 등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
