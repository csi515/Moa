import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { PageHeader, FilterBar } from '@/shared/components';
import {
  getAcademySubjectLabel,
  getAcademySubjectOptions,
} from '@/modules/academy/config/subjects';
import type { AcademyHomeworkStatus } from '@/modules/academy/types/academyLearning';
import {
  BookOpenCheck,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';

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
  const { scopeStudents } = useStaffScope();
  const refreshKey = useStorageRefresh();

  const settings = StorageService.getSettings();
  const subjectOptions = getAcademySubjectOptions(settings);
  const classes = StorageService.getClasses();
  const students = scopeStudents(
    StorageService.getStudents().filter((s) => s.status === 'active')
  );

  const assignments = useMemo(
    () => StorageService.getAcademyHomeworkAssignments(),
    [refreshKey]
  );
  const allChecks = useMemo(() => StorageService.getAcademyHomeworkChecks(), [refreshKey]);

  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignments[0]?.id || '');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subject: subjectOptions[0]?.label || '국어',
    assignedDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    classId: '',
    description: '',
  });

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignmentId);
  const checksForAssignment = selectedAssignment
    ? allChecks.filter((c) => c.assignmentId === selectedAssignment.id)
    : [];

  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const stats = useMemo(() => {
    const completed = checksForAssignment.filter((c) => c.status === 'completed').length;
    const incomplete = checksForAssignment.filter((c) => c.status === 'incomplete').length;
    const pending = checksForAssignment.filter((c) => c.status === 'pending').length;
    return { completed, incomplete, pending, total: checksForAssignment.length };
  }, [checksForAssignment]);

  const handleCreate = () => {
    if (!form.title.trim()) {
      showToast('숙제 제목을 입력해 주세요.', 'warning');
      return;
    }
    let targetIds = students.map((s) => s.id);
    if (form.classId) {
      targetIds = students.filter((s) => s.classIds?.includes(form.classId)).map((s) => s.id);
    }
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

  const handleDeleteAssignment = () => {
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
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            숙제 부여
          </button>
        }
      />

      <FilterBar>
        <select
          value={selectedAssignmentId}
          onChange={(e) => setSelectedAssignmentId(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl font-bold"
        >
          {assignments.length === 0 && <option value="">등록된 숙제 없음</option>}
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.assignedDate} · {getAcademySubjectLabel(a.subject)} · {a.title}
            </option>
          ))}
        </select>
        {selectedAssignment && (
          <button
            type="button"
            onClick={handleDeleteAssignment}
            className="px-3 py-2 min-h-[44px] min-w-[44px] text-rose-600 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center"
            aria-label="숙제 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </FilterBar>

      {selectedAssignment ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  {getAcademySubjectLabel(selectedAssignment.subject)}
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedAssignment.title}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  부여일 {selectedAssignment.assignedDate}
                  {selectedAssignment.dueDate ? ` · 마감 ${selectedAssignment.dueDate}` : ''}
                </p>
                {selectedAssignment.description && (
                  <p className="text-sm text-slate-600 mt-2">{selectedAssignment.description}</p>
                )}
              </div>
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
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[1fr_auto] gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
              <span>원생</span>
              <span>이행 상태</span>
            </div>
            <div className="divide-y divide-slate-100">
              {checksForAssignment.map((check) => {
                const student = studentMap.get(check.studentId);
                if (!student) return null;
                return (
                  <div
                    key={check.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.grade || student.level}</p>
                    </div>
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
              {checksForAssignment.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-8">체크할 원생이 없습니다</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <BookOpenCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">아직 부여된 숙제가 없습니다</p>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2.5 min-h-[44px] text-sm font-bold text-indigo-600 hover:underline"
          >
            첫 숙제 부여하기
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="font-bold text-slate-900">숙제 부여</h3>
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
              <button
                type="button"
                onClick={handleCreate}
                className="w-full py-3 min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl"
              >
                숙제 부여하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
