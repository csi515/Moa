/** 종합학원 숙제·시험 학습 기록 */

export type AcademyHomeworkStatus = 'pending' | 'completed' | 'incomplete';

/** 숙제 부여 (반/전체 공통) */
export interface AcademyHomeworkAssignment {
  id: string;
  title: string;
  /** 과목 라벨 (국어, 수학 등) */
  subject: string;
  assignedDate: string;
  dueDate?: string;
  classId?: string;
  description?: string;
  staffId?: string;
  createdAt: string;
}

/** 원생별 숙제 이행 체크 */
export interface AcademyHomeworkCheck {
  id: string;
  assignmentId: string;
  studentId: string;
  status: AcademyHomeworkStatus;
  checkedAt?: string;
  memo?: string;
}

/** 시험/평가 */
export interface AcademyExam {
  id: string;
  title: string;
  subject: string;
  examDate: string;
  maxScore: number;
  classId?: string;
  memo?: string;
  staffId?: string;
  createdAt: string;
}

/** 원생별 시험 점수 */
export interface AcademyExamScore {
  id: string;
  examId: string;
  studentId: string;
  /** null = 미응시 */
  score: number | null;
  memo?: string;
}
