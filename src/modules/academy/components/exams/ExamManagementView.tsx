import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { PageHeader, EmptyState, Modal } from '@/shared/components';
import { getAcademySubjectLabel } from '@/modules/academy/config/subjects';
import { useAcademyLearningContext } from '@/modules/academy/hooks/useAcademyLearningContext';
import { resolveTargetStudents } from '@/modules/academy/utils/resolveTargetStudents';
import { AcademyEntityPickerBar } from '@/modules/academy/components/shared/AcademyEntityPickerBar';
import { AcademyLearningDetailCard } from '@/modules/academy/components/shared/AcademyLearningDetailCard';
import { AcademyStudentInfo } from '@/modules/academy/components/shared/AcademyStudentInfo';
import { AcademyStudentRoster } from '@/modules/academy/components/shared/AcademyStudentRoster';
import { AcademySubjectClassFields } from '@/modules/academy/components/shared/AcademySubjectClassFields';
import { AcademyPrimaryButton } from '@/modules/academy/components/shared/AcademyPrimaryButton';
import { ClipboardList } from 'lucide-react';

/** 종합학원 시험·점수 기록 */
export const ExamManagementView: React.FC = () => {
  const { showToast, triggerRefresh, currentUser } = useApp();
  const { refreshKey, subjectOptions, classes, students, studentMap, defaultSubjectLabel } =
    useAcademyLearningContext();

  const exams = useMemo(() => StorageService.getAcademyExams(), [refreshKey]);
  const allScores = useMemo(() => StorageService.getAcademyExamScores(), [refreshKey]);

  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || '');
  const [showCreate, setShowCreate] = useState(false);
  const [draftScores, setDraftScores] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    title: '',
    subject: defaultSubjectLabel,
    examDate: new Date().toISOString().slice(0, 10),
    maxScore: 100,
    classId: '',
    memo: '',
  });

  const selectedExam = exams.find((e) => e.id === selectedExamId);
  const scoresForExam = selectedExam
    ? allScores.filter((s) => s.examId === selectedExam.id)
    : [];

  const examStats = useMemo(() => {
    const numeric = scoresForExam.filter((s) => s.score != null).map((s) => s.score as number);
    if (numeric.length === 0) return { avg: null, count: 0, max: selectedExam?.maxScore ?? 100 };
    const avg = Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10;
    return { avg, count: numeric.length, max: selectedExam?.maxScore ?? 100 };
  }, [scoresForExam, selectedExam]);

  useEffect(() => {
    if (!selectedExam) {
      setDraftScores({});
      return;
    }
    const rows = StorageService.getAcademyExamScores(selectedExam.id);
    const next: Record<string, string> = {};
    for (const row of rows) {
      next[row.studentId] = row.score == null ? '' : String(row.score);
    }
    setDraftScores(next);
  }, [selectedExamId, refreshKey, selectedExam]);

  const entityOptions = exams.map((e) => ({
    id: e.id,
    label: `${e.examDate} · ${getAcademySubjectLabel(e.subject)} · ${e.title}`,
  }));

  const handleCreate = () => {
    if (!form.title.trim()) {
      showToast('시험 이름을 입력해 주세요.', 'warning');
      return;
    }
    const targets = resolveTargetStudents(students, form.classId || undefined);
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

  const handleDelete = () => {
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
        actions={<AcademyPrimaryButton label="시험 등록" onClick={() => setShowCreate(true)} />}
      />

      <AcademyEntityPickerBar
        value={selectedExamId}
        onChange={setSelectedExamId}
        options={entityOptions}
        emptyLabel="등록된 시험 없음"
        onDelete={selectedExam ? handleDelete : undefined}
        deleteAriaLabel="시험 삭제"
      />

      {selectedExam ? (
        <>
          <AcademyLearningDetailCard
            subjectLabel={getAcademySubjectLabel(selectedExam.subject)}
            title={selectedExam.title}
            meta={`시험일 ${selectedExam.examDate} · 만점 ${selectedExam.maxScore}점`}
            description={selectedExam.memo}
            aside={
              examStats.avg != null ? (
                <div className="text-right">
                  <p className="text-xs text-slate-500">평균 ({examStats.count}명)</p>
                  <p className="text-2xl font-extrabold text-indigo-700">
                    {examStats.avg}
                    <span className="text-sm font-bold text-slate-400">/{examStats.max}</span>
                  </p>
                </div>
              ) : undefined
            }
          />

          <AcademyStudentRoster
            columns={['원생', '점수']}
            footer={
              <button
                type="button"
                onClick={saveScores}
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl"
              >
                점수 저장
              </button>
            }
          >
            {scoresForExam.map((row) => {
              const student = studentMap.get(row.studentId);
              if (!student) return null;
              return (
                <div
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4"
                >
                  <AcademyStudentInfo student={student} />
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
          </AcademyStudentRoster>
        </>
      ) : (
        <EmptyState
          icon={<ClipboardList className="w-10 h-10" />}
          title="등록된 시험이 없습니다"
          action={
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2.5 min-h-[44px] text-sm font-bold text-indigo-600 hover:underline"
            >
              첫 시험 등록하기
            </button>
          }
        />
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="시험 등록" maxWidth="lg">
        <div className="p-5 space-y-4">
          <AcademySubjectClassFields
            subject={form.subject}
            classId={form.classId}
            subjectOptions={subjectOptions}
            classes={classes}
            onSubjectChange={(subject) => setForm({ ...form, subject })}
            onClassChange={(classId) => setForm({ ...form, classId })}
          />
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
      </Modal>
    </div>
  );
};
