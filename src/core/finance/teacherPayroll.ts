import type {
  Expense,
  LessonRecord,
  PaymentMethod,
  Teacher,
  TeacherPayType,
} from '@/types';

export interface TeacherPayrollRow {
  teacherId: string;
  teacherName: string;
  status: Teacher['status'];
  payType: TeacherPayType;
  lessonCount: number;
  /** 시급 또는 월급 */
  rate: number;
  amount: number;
  settledExpenseId?: string;
  settledAmount?: number;
}

/** 정산 방식 추론 */
export function resolveTeacherPayType(teacher: Pick<Teacher, 'payType' | 'hourlyRate' | 'salary'>): TeacherPayType {
  if (teacher.payType === 'hourly' || teacher.payType === 'monthly' || teacher.payType === 'none') {
    return teacher.payType;
  }
  if ((teacher.hourlyRate || 0) > 0) return 'hourly';
  if ((teacher.salary || 0) > 0) return 'monthly';
  return 'none';
}

/** 업종별 강사 정산 지출 카테고리 */
export function getPayrollExpenseCategory(industry?: string | null): string {
  if (industry === 'pilates' || industry === 'gym' || industry === 'taekwondo') {
    return 'instructor_fee';
  }
  if (industry === 'daycare' || industry === 'piano') {
    return 'teacher_salary';
  }
  return 'salary';
}

export function countLessonsForTeacher(
  lessons: LessonRecord[],
  teacherId: string,
  yearMonth: string
): number {
  return lessons.filter(
    (l) => l.teacherId === teacherId && l.date.startsWith(yearMonth)
  ).length;
}

export function computePayrollAmount(params: {
  payType: TeacherPayType;
  lessonCount: number;
  hourlyRate?: number;
  salary?: number;
}): number {
  if (params.payType === 'hourly') {
    return Math.max(0, (params.hourlyRate || 0) * params.lessonCount);
  }
  if (params.payType === 'monthly') {
    return Math.max(0, params.salary || 0);
  }
  return 0;
}

function findSettledExpense(
  expenses: Expense[],
  teacherId: string,
  yearMonth: string
): Expense | undefined {
  return expenses.find(
    (e) =>
      e.settlementKind === 'teacher_payroll' &&
      e.teacherId === teacherId &&
      e.settlementYearMonth === yearMonth
  );
}

/** 해당 월 강사별 정산 미리보기 */
export function buildTeacherPayrollRows(params: {
  teachers: Teacher[];
  lessons: LessonRecord[];
  expenses: Expense[];
  yearMonth: string;
  includeInactive?: boolean;
}): TeacherPayrollRow[] {
  const teachers = params.teachers.filter((t) =>
    params.includeInactive ? true : t.status === 'active'
  );

  return teachers
    .map((teacher) => {
      const payType = resolveTeacherPayType(teacher);
      const lessonCount = countLessonsForTeacher(
        params.lessons,
        teacher.id,
        params.yearMonth
      );
      const rate =
        payType === 'hourly'
          ? teacher.hourlyRate || 0
          : payType === 'monthly'
            ? teacher.salary || 0
            : 0;
      const amount = computePayrollAmount({
        payType,
        lessonCount,
        hourlyRate: teacher.hourlyRate,
        salary: teacher.salary,
      });
      const settled = findSettledExpense(
        params.expenses,
        teacher.id,
        params.yearMonth
      );

      return {
        teacherId: teacher.id,
        teacherName: teacher.name,
        status: teacher.status,
        payType,
        lessonCount,
        rate,
        amount,
        settledExpenseId: settled?.id,
        settledAmount: settled?.amount,
      };
    })
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ko'));
}

export function settlementExpenseDate(yearMonth: string): string {
  const [y, m] = yearMonth.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);
  const endOfMonth = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  return today.startsWith(yearMonth) ? today : endOfMonth;
}

export function buildPayrollExpenseDraft(params: {
  teacher: Teacher;
  yearMonth: string;
  amount: number;
  lessonCount: number;
  payType: TeacherPayType;
  industry?: string | null;
  paymentMethod?: PaymentMethod;
}): Omit<Expense, 'id'> {
  const payType = params.payType;
  const detail =
    payType === 'hourly'
      ? `레슨 ${params.lessonCount}회 × 시급`
      : payType === 'monthly'
        ? '월급'
        : '정산';

  return {
    date: settlementExpenseDate(params.yearMonth),
    category: getPayrollExpenseCategory(params.industry) as Expense['category'],
    amount: Math.max(0, Math.round(params.amount)),
    paymentMethod: params.paymentMethod || 'transfer',
    description: `${params.yearMonth} 강사 정산 · ${params.teacher.name} (${detail})`,
    recipient: params.teacher.name,
    memo: `teacher_payroll:${params.yearMonth}:${params.teacher.id}`,
    teacherId: params.teacher.id,
    settlementYearMonth: params.yearMonth,
    settlementKind: 'teacher_payroll',
  };
}
