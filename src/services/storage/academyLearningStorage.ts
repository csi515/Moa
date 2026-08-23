import { STORAGE_KEYS } from '@/services/adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from './helpers';
import type {
  AcademyExam,
  AcademyExamScore,
  AcademyHomeworkAssignment,
  AcademyHomeworkCheck,
  AcademyHomeworkStatus,
} from '@/modules/academy/types/academyLearning';
import type { Student } from '@/types';

export function createAcademyLearningStorage(_api: StorageApi) {
  return {
    getAcademyHomeworkAssignments(): AcademyHomeworkAssignment[] {
      return getItem<AcademyHomeworkAssignment[]>(STORAGE_KEYS.ACADEMY_HOMEWORK_ASSIGNMENTS, []);
    },

    saveAcademyHomeworkAssignment(
      input: Omit<AcademyHomeworkAssignment, 'id' | 'createdAt'> & { id?: string }
    ): AcademyHomeworkAssignment {
      const list = this.getAcademyHomeworkAssignments();
      const now = new Date().toISOString();
      if (input.id) {
        const idx = list.findIndex((a) => a.id === input.id);
        const saved: AcademyHomeworkAssignment = {
          ...input,
          id: input.id,
          createdAt: list[idx]?.createdAt || now,
        };
        if (idx >= 0) list[idx] = saved;
        else list.push(saved);
        setItem(STORAGE_KEYS.ACADEMY_HOMEWORK_ASSIGNMENTS, list);
        return saved;
      }
      const saved: AcademyHomeworkAssignment = {
        ...input,
        id: generateEntityId('hw_assign'),
        createdAt: now,
      };
      list.unshift(saved);
      setItem(STORAGE_KEYS.ACADEMY_HOMEWORK_ASSIGNMENTS, list);
      return saved;
    },

    deleteAcademyHomeworkAssignment(id: string): boolean {
      const assignments = this.getAcademyHomeworkAssignments();
      const filtered = assignments.filter((a) => a.id !== id);
      if (filtered.length === assignments.length) return false;
      setItem(STORAGE_KEYS.ACADEMY_HOMEWORK_ASSIGNMENTS, filtered);
      const checks = this.getAcademyHomeworkChecks().filter((c) => c.assignmentId !== id);
      setItem(STORAGE_KEYS.ACADEMY_HOMEWORK_CHECKS, checks);
      return true;
    },

    getAcademyHomeworkChecks(assignmentId?: string): AcademyHomeworkCheck[] {
      const list = getItem<AcademyHomeworkCheck[]>(STORAGE_KEYS.ACADEMY_HOMEWORK_CHECKS, []);
      if (!assignmentId) return list;
      return list.filter((c) => c.assignmentId === assignmentId);
    },

    saveAcademyHomeworkCheck(
      input: Omit<AcademyHomeworkCheck, 'id'> & { id?: string }
    ): AcademyHomeworkCheck {
      const list = this.getAcademyHomeworkChecks();
      if (input.id) {
        const idx = list.findIndex((c) => c.id === input.id);
        const saved: AcademyHomeworkCheck = { ...input, id: input.id };
        if (idx >= 0) list[idx] = saved;
        else list.push(saved);
        setItem(STORAGE_KEYS.ACADEMY_HOMEWORK_CHECKS, list);
        return saved;
      }
      const existingIdx = list.findIndex(
        (c) => c.assignmentId === input.assignmentId && c.studentId === input.studentId
      );
      const saved: AcademyHomeworkCheck = {
        ...input,
        id: generateEntityId('hw_check'),
      };
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...saved, id: list[existingIdx].id };
        setItem(STORAGE_KEYS.ACADEMY_HOMEWORK_CHECKS, list);
        return list[existingIdx];
      }
      list.push(saved);
      setItem(STORAGE_KEYS.ACADEMY_HOMEWORK_CHECKS, list);
      return saved;
    },

    setAcademyHomeworkStatus(
      assignmentId: string,
      studentId: string,
      status: AcademyHomeworkStatus,
      memo?: string
    ): AcademyHomeworkCheck {
      const existing = this.getAcademyHomeworkChecks(assignmentId).find(
        (c) => c.studentId === studentId
      );
      return this.saveAcademyHomeworkCheck({
        ...(existing ? { id: existing.id } : {}),
        assignmentId,
        studentId,
        status,
        checkedAt: status === 'pending' ? undefined : new Date().toISOString(),
        memo: memo ?? existing?.memo,
      });
    },

    /** 숙제 부여 + 대상 원생 체크 행 생성 */
    createAcademyHomeworkWithChecks(input: {
      title: string;
      subject: string;
      assignedDate: string;
      dueDate?: string;
      classId?: string;
      description?: string;
      staffId?: string;
      studentIds: string[];
    }): AcademyHomeworkAssignment {
      const assignment = this.saveAcademyHomeworkAssignment({
        title: input.title,
        subject: input.subject,
        assignedDate: input.assignedDate,
        dueDate: input.dueDate,
        classId: input.classId,
        description: input.description,
        staffId: input.staffId,
      });
      for (const studentId of input.studentIds) {
        this.saveAcademyHomeworkCheck({
          assignmentId: assignment.id,
          studentId,
          status: 'pending',
        });
      }
      return assignment;
    },

    getAcademyExams(): AcademyExam[] {
      return getItem<AcademyExam[]>(STORAGE_KEYS.ACADEMY_EXAMS, []).sort((a, b) =>
        b.examDate.localeCompare(a.examDate)
      );
    },

    saveAcademyExam(input: Omit<AcademyExam, 'id' | 'createdAt'> & { id?: string }): AcademyExam {
      const list = getItem<AcademyExam[]>(STORAGE_KEYS.ACADEMY_EXAMS, []);
      const now = new Date().toISOString();
      if (input.id) {
        const idx = list.findIndex((e) => e.id === input.id);
        const saved: AcademyExam = {
          ...input,
          id: input.id,
          createdAt: list[idx]?.createdAt || now,
        };
        if (idx >= 0) list[idx] = saved;
        else list.push(saved);
        setItem(STORAGE_KEYS.ACADEMY_EXAMS, list);
        return saved;
      }
      const saved: AcademyExam = {
        ...input,
        id: generateEntityId('exam'),
        createdAt: now,
      };
      list.unshift(saved);
      setItem(STORAGE_KEYS.ACADEMY_EXAMS, list);
      return saved;
    },

    deleteAcademyExam(id: string): boolean {
      const exams = getItem<AcademyExam[]>(STORAGE_KEYS.ACADEMY_EXAMS, []);
      const filtered = exams.filter((e) => e.id !== id);
      if (filtered.length === exams.length) return false;
      setItem(STORAGE_KEYS.ACADEMY_EXAMS, filtered);
      const scores = this.getAcademyExamScores().filter((s) => s.examId !== id);
      setItem(STORAGE_KEYS.ACADEMY_EXAM_SCORES, scores);
      return true;
    },

    getAcademyExamScores(examId?: string): AcademyExamScore[] {
      const list = getItem<AcademyExamScore[]>(STORAGE_KEYS.ACADEMY_EXAM_SCORES, []);
      if (!examId) return list;
      return list.filter((s) => s.examId === examId);
    },

    saveAcademyExamScore(
      input: Omit<AcademyExamScore, 'id'> & { id?: string }
    ): AcademyExamScore {
      const list = this.getAcademyExamScores();
      if (input.id) {
        const idx = list.findIndex((s) => s.id === input.id);
        const saved: AcademyExamScore = { ...input, id: input.id };
        if (idx >= 0) list[idx] = saved;
        else list.push(saved);
        setItem(STORAGE_KEYS.ACADEMY_EXAM_SCORES, list);
        return saved;
      }
      const existingIdx = list.findIndex(
        (s) => s.examId === input.examId && s.studentId === input.studentId
      );
      const saved: AcademyExamScore = {
        ...input,
        id: generateEntityId('exam_score'),
      };
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...saved, id: list[existingIdx].id };
        setItem(STORAGE_KEYS.ACADEMY_EXAM_SCORES, list);
        return list[existingIdx];
      }
      list.push(saved);
      setItem(STORAGE_KEYS.ACADEMY_EXAM_SCORES, list);
      return saved;
    },

    createAcademyExamWithScores(input: {
      title: string;
      subject: string;
      examDate: string;
      maxScore: number;
      classId?: string;
      memo?: string;
      staffId?: string;
      students: Pick<Student, 'id'>[];
    }): AcademyExam {
      const exam = this.saveAcademyExam({
        title: input.title,
        subject: input.subject,
        examDate: input.examDate,
        maxScore: input.maxScore,
        classId: input.classId,
        memo: input.memo,
        staffId: input.staffId,
      });
      for (const st of input.students) {
        this.saveAcademyExamScore({
          examId: exam.id,
          studentId: st.id,
          score: null,
        });
      }
      return exam;
    },
  };
}
