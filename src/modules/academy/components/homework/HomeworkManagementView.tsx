import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { PageHeader, EmptyState, Modal } from '@/shared/components';
import { getAcademySubjectLabel } from '@/modules/academy/config/subjects';
import { useAcademyLearningContext } from '@/modules/academy/hooks/useAcademyLearningContext';
import { resolveTargetStudentIds } from '@/modules/academy/utils/resolveTargetStudents';
import type { AcademyHomeworkStatus } from '@/modules/academy/types/academyLearning';
import { AcademyEntityPickerBar } from '@/modules/academy/components/shared/AcademyEntityPickerBar';
import { AcademyLearningDetailCard } from '@/modules/academy/components/shared/AcademyLearningDetailCard';
import { AcademyStudentInfo } from '@/modules/academy/components/shared/AcademyStudentInfo';
import { AcademyStudentRoster } from '@/modules/academy/components/shared/AcademyStudentRoster';
import { AcademySubjectClassFields } from '@/modules/academy/components/shared/AcademySubjectClassFields';
import { AcademyPrimaryButton } from '@/modules/academy/components/shared/AcademyPrimaryButton';
import { BookOpenCheck, CheckCircle2, Circle, XCircle } from 'lucide-react';

const STATUS_LABEL: Record<AcademyHomeworkStatus, string> = {
  pending: '미확인',
  completed: '완료',
  incomplete: '미완료',
};

const STATUS_STYLE: Record<AcademyHomeworkStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 border-slate-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  incomplete: 'bg-rose-50 text-rose-700 border-rose-200',
};

/** 종합학원 숙제 이행 체크 */
export const HomeworkManagementView: React.FC = () => {
  const { showToast, triggerRefresh, currentUser } = useApp();
  const { refreshKey, subjectOptions, classes, students, studentMap, defaultSubjectLabel } =
    useAcademyLearningContext();

  const assignments = useMemo(
    () => StorageService.getAcademyHomeworkAssignments(),
    [refreshKey]
  );
  const allChecks = useMemo(() => StorageService.getAcademyHomeworkChecks(), [refreshKey]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignments[0]?.id || '');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: defaultSubjectLabel,
    assignedDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    classId: '',
    description: '',
  });

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);
  const checksForAssignment = selectedAssignment
    ? allChecks.filter((c) => c.assignmentId === selectedAssignment.id)
    : [];

  const stats = useMemo(() => {
    const completed = checksForAssignment.filter((c) => c.status === 'completed').length;
    const incomplete = checksForAssignment.filter((c) => c.status === 'incomplete').length;
    const pending = checksForAssignment.filter((c) => c.status === 'pending').length;
    return { completed, incomplete, pending };
  }, [checksForAssignment]);

  const entityOptions = assignments.map((a) => ({
    id: a.id,
    label: `${a.assignedDate} · ${getAcademySubjectLabel(a.subject)} · ${a.title}`,
  }));

  const handleCreate = () => {
    if (!form.title.trim()) {
      showToast('숙제 제목을 입력해 주세요.', 'warning');
      return;
    }
    const targetIds = resolveTargetStudentIds(students, form.classId || undefined);
    if (targetIds.length === 0) {
      showToast('숙제를 부여할 재원생이 없습니다.', 'warning');
      return;
    }
    const created = StorageService.createAcademyHomeworkWithChecks({
      title: form.title.trim(),
      subject: form.subject,
      assignedDate: form.assignedDate,
      dueDate: form.dueDate || undefined,
      classId: form.classId || undefined,
      description: form.description.trim() || undefined,
      staffId: currentUser.staffId || undefined,
      studentIds: targetIds,
    });
    setSelectedAssignmentId(created.id);
    setShowCreate(false);
    setForm((prev) => ({ ...prev, title: '', description: '' }));
    showToast(`${targetIds.length}명에게 숙제가 부여되었습니다.`, 'success');
    triggerRefresh();
  };

  const setStatus = (studentId: string, status: AcademyHomeworkStatus) => {
    if (!selectedAssignment) return;
    StorageService.setAcademyHomeworkStatus(selectedAssignment.id, studentId, status);
    triggerRefresh();
  };

  const handleDelete = () => {
    if (!selectedAssignment) return;
    StorageService.deleteAcademyHomeworkAssignment(selectedAssignment.id);
    setSelectedAssignmentId(assignments.find((a) => a.id !== selectedAssignment.id)?.id || '');
    showToast('숙제가 삭제되었습니다.', 'info');
    triggerRefresh();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<BookOpenCheck className="w-6 h-6" />}
        title="숙제 관리"
        description="원생별 숙제 이행 여부(완료/미완료)를 체크합니다"
        actions={<AcademyPrimaryButton label="숙제 부여" onClick={() => setShowCreate(true)} />}
      />

      <AcademyEntityPickerBar
        value={selectedAssignmentId}
        onChange={setSelectedAssignmentId}
        options={entityOptions}
        emptyLabel="등록된 숙제 없음"
        onDelete={selectedAssignment ? handleDelete : undefined}
        deleteAriaLabel="숙제 삭제"
      />

      {selectedAssignment ? (
        <>
          <AcademyLearningDetailCard
            subjectLabel={getAcademySubjectLabel(selectedAssignment.subject)}
            title={selectedAssignment.title}
            meta={`부여일 ${selectedAssignment.assignedDate}${
              selectedAssignment.dueDate ? ` · 마감 ${selectedAssignment.dueDate}` : ''
            }`}
            description={selectedAssignment.description}
            aside={
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold">
                  완료 {stats.completed}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold">
                  미완료 {stats.incomplete}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">
                  미확인 {stats.pending}
                </span>
              </div>
            }
          />

          <AcademyStudentRoster
            columns={['원생', '이행 상태']}
            isEmpty={checksForAssignment.length === 0}
            emptyMessage="체크할 원생이 없습니다"
          >
            {checksForAssignment.map((check) => {
              const student = studentMap.get(check.studentId);
              if (!student) return null;
              return (
                <div
                  key={check.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4"
                >
                  <AcademyStudentInfo student={student} />
                  <div className="flex flex-wrap gap-2">
                    {(['pending', 'completed', 'incomplete'] as AcademyHomeworkStatus[]).map(
                      (status) => {
                        const active = check.status === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => setStatus(check.studentId, status)}
                            className={`px-3 py-2 min-h-[44px] text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all ${
                              active
                                ? STATUS_STYLE[status]
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                            {status === 'incomplete' && <XCircle className="w-3.5 h-3.5" />}
                            {status === 'pending' && <Circle className="w-3.5 h-3.5" />}
                            {STATUS_LABEL[status]}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              );
            })}
          </AcademyStudentRoster>
        </>
      ) : (
        <EmptyState
          icon={<BookOpenCheck className="w-10 h-10" />}
          title="아직 부여된 숙제가 없습니다"
          action={
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2.5 min-h-[44px] text-sm font-bold text-indigo-600 hover:underline"
            >
              첫 숙제 부여하기
            </button>
          }
        />
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="숙제 부여" maxWidth="lg">
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
              숙제 제목 <span className="text-rose-500">*</span>
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 3단원 문제집 1~20번"
              className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">설명</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">부여일</label>
              <input
                type="date"
                value={form.assignedDate}
                onChange={(e) => setForm({ ...form, assignedDate: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">마감일</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="w-full py-3 min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl"
          >
            숙제 부여하기
          </button>
        </div>
      </Modal>
    </div>
  );
};
