import type {
  AttendanceRecord,
  Expense,
  LessonRecord,
  PracticeRecord,
  Song,
  Student,
  Textbook,
  TextbookInventoryTransaction,
  TextbookPayment,
  TextbookSale,
} from '../../../types';
import type {
  Json,
  PaymentMethod as DbPaymentMethod,
  PianoAttendanceStatus,
  PianoInventoryTransactionType,
  PianoTextbookPaymentStatus,
} from '../../../lib/supabase/database.types';

type PianoCustomerRow = {
  customer_id: string;
  organization_id: string;
  student_number: string;
  gender: string;
  birth_date: string | null;
  school: string | null;
  grade: string | null;
  level: string;
  tuition_fee: number;
  payment_day: number;
  teacher_id: string | null;
  join_date: string | null;
  leave_date: string | null;
  special_notes: string | null;
  avatar_color: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
};

// ─── Piano Customers (Student extension) ──────────────────────────

export function studentToPianoCustomerRow(student: Student, organizationId: string) {
  return {
    customer_id: student.id,
    organization_id: organizationId,
    student_number: student.studentNumber,
    gender: student.gender,
    birth_date: student.birthDate || null,
    school: student.school || null,
    grade: student.grade || null,
    level: student.level,
    tuition_fee: student.tuitionFee,
    payment_day: student.paymentDay,
    teacher_id: student.teacherId || null,
    join_date: student.joinDate || null,
    leave_date: student.leaveDate || null,
    special_notes: student.specialNotes || null,
    avatar_color: student.avatarColor || null,
    metadata: {} as Json,
  };
}

export function mergeStudentWithPiano(
  base: Student,
  row: PianoCustomerRow,
  classIds: string[],
  teacherName?: string
): Student {
  return {
    ...base,
    studentNumber: row.student_number || base.studentNumber,
    gender: (row.gender as Student['gender']) || base.gender,
    birthDate: row.birth_date || base.birthDate,
    school: row.school || base.school,
    grade: row.grade || base.grade,
    level: (row.level as Student['level']) || base.level,
    tuitionFee: Number(row.tuition_fee) ?? base.tuitionFee,
    paymentDay: row.payment_day ?? base.paymentDay,
    teacherId: row.teacher_id || base.teacherId,
    teacherName: teacherName || base.teacherName,
    joinDate: row.join_date || base.joinDate,
    leaveDate: row.leave_date || undefined,
    specialNotes: row.special_notes || base.specialNotes,
    avatarColor: row.avatar_color || base.avatarColor,
    classIds,
    createdAt: row.created_at || base.createdAt,
    updatedAt: row.updated_at || base.updatedAt,
  };
}

// ─── Attendance ───────────────────────────────────────────────────

interface SaleMetadata {
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  textbookTitle?: string;
  studentName?: string;
  teacherName?: string;
}

const ATTENDANCE_TO_DB: Record<AttendanceRecord['status'], PianoAttendanceStatus> = {
  present: 'present',
  absent: 'absent',
  late: 'late',
  early_leave: 'early_leave',
  make_up: 'make_up',
};

const DB_TO_ATTENDANCE: Record<PianoAttendanceStatus, AttendanceRecord['status']> = {
  present: 'present',
  absent: 'absent',
  late: 'late',
  early_leave: 'early_leave',
  make_up: 'make_up',
};

export function attendanceToPianoRow(record: AttendanceRecord, organizationId: string) {
  return {
    id: record.id,
    organization_id: organizationId,
    customer_id: record.studentId,
    service_id: record.classId || null,
    attendance_date: record.date,
    status: ATTENDANCE_TO_DB[record.status],
    absent_reason: record.absentReason || null,
    make_up_required: record.makeUpRequired ?? false,
    make_up_date: record.makeUpDate || null,
    memo: record.memo || null,
    created_by: record.createdBy || null,
    metadata: {
      studentName: record.studentName,
      className: record.className,
    } as Json,
  };
}

export function pianoRowToAttendance(row: {
  id: string;
  customer_id: string;
  service_id: string | null;
  attendance_date: string;
  status: PianoAttendanceStatus;
  absent_reason: string | null;
  make_up_required: boolean;
  make_up_date: string | null;
  memo: string | null;
  created_by: string | null;
  metadata: Json;
  created_at: string;
}): AttendanceRecord {
  const meta = (row.metadata || {}) as { studentName?: string; className?: string };
  return {
    id: row.id,
    date: row.attendance_date,
    studentId: row.customer_id,
    studentName: meta.studentName || '',
    classId: row.service_id || '',
    className: meta.className || '',
    status: DB_TO_ATTENDANCE[row.status],
    absentReason: row.absent_reason || undefined,
    makeUpRequired: row.make_up_required,
    makeUpDate: row.make_up_date || undefined,
    memo: row.memo || undefined,
    createdBy: row.created_by || '',
    createdAt: row.created_at,
  };
}

// ─── Lesson Records ───────────────────────────────────────────────

export function lessonToPianoRow(rec: LessonRecord, organizationId: string) {
  return {
    id: rec.id,
    organization_id: organizationId,
    customer_id: rec.studentId,
    staff_id: rec.teacherId || null,
    service_id: rec.classId || null,
    lesson_date: rec.date,
    song_title: rec.songTitle,
    progress: rec.progress || null,
    lesson_content: rec.lessonContent || null,
    strengths: rec.strengths || null,
    weaknesses: rec.weaknesses || null,
    homework: rec.homework || null,
    next_plan: rec.nextPlan || null,
    teacher_notes: rec.teacherNotes || null,
    memo: rec.memo || null,
    metadata: {
      studentName: rec.studentName,
      className: rec.className,
      teacherName: rec.teacherName,
    } as Json,
  };
}

export function pianoRowToLesson(row: {
  id: string;
  customer_id: string;
  staff_id: string | null;
  service_id: string | null;
  lesson_date: string;
  song_title: string;
  progress: string | null;
  lesson_content: string | null;
  strengths: string | null;
  weaknesses: string | null;
  homework: string | null;
  next_plan: string | null;
  teacher_notes: string | null;
  memo: string | null;
  metadata: Json;
  created_at: string;
}): LessonRecord {
  const meta = (row.metadata || {}) as { studentName?: string; className?: string; teacherName?: string };
  return {
    id: row.id,
    studentId: row.customer_id,
    studentName: meta.studentName || '',
    date: row.lesson_date,
    classId: row.service_id || undefined,
    className: meta.className,
    songTitle: row.song_title,
    progress: row.progress || '',
    lessonContent: row.lesson_content || '',
    strengths: row.strengths || undefined,
    weaknesses: row.weaknesses || undefined,
    homework: row.homework || undefined,
    nextPlan: row.next_plan || undefined,
    teacherNotes: row.teacher_notes || undefined,
    memo: row.memo || undefined,
    teacherId: row.staff_id || '',
    teacherName: meta.teacherName || '',
    createdAt: row.created_at,
  };
}

// ─── Practice Records ─────────────────────────────────────────────

export function practiceToPianoRow(rec: PracticeRecord, organizationId: string) {
  return {
    id: rec.id,
    organization_id: organizationId,
    customer_id: rec.studentId,
    practice_date: rec.date,
    minutes: rec.minutes,
    song_title: rec.songTitle,
    textbook: rec.textbook || null,
    page: rec.page || null,
    homework: rec.homework || null,
    teacher_evaluation: rec.teacherEvaluation || null,
    difficulty_part: rec.difficultyPart || null,
    next_assignment: rec.nextAssignment || null,
    metadata: { studentName: rec.studentName } as Json,
  };
}

export function pianoRowToPractice(row: {
  id: string;
  customer_id: string;
  practice_date: string;
  minutes: number;
  song_title: string;
  textbook: string | null;
  page: string | null;
  homework: string | null;
  teacher_evaluation: string | null;
  difficulty_part: string | null;
  next_assignment: string | null;
  metadata: Json;
  created_at: string;
}): PracticeRecord {
  const meta = (row.metadata || {}) as { studentName?: string };
  return {
    id: row.id,
    studentId: row.customer_id,
    studentName: meta.studentName || '',
    date: row.practice_date,
    minutes: row.minutes,
    songTitle: row.song_title,
    textbook: row.textbook || undefined,
    page: row.page || undefined,
    homework: row.homework || undefined,
    teacherEvaluation: row.teacher_evaluation || undefined,
    difficultyPart: row.difficulty_part || undefined,
    nextAssignment: row.next_assignment || undefined,
    createdAt: row.created_at,
  };
}

// ─── Textbooks ────────────────────────────────────────────────────

export function textbookToPianoRow(tb: Textbook, organizationId: string) {
  return {
    id: tb.id,
    organization_id: organizationId,
    title: tb.title,
    publisher: tb.publisher,
    author: tb.author || null,
    isbn: tb.isbn || null,
    level: tb.level,
    sale_price: tb.salePrice ?? tb.price,
    cost_price: tb.costPrice,
    stock: tb.stock ?? tb.currentStock ?? 0,
    min_stock: tb.minStock,
    is_for_sale: tb.isForSale,
    memo: tb.memo || null,
    metadata: {} as Json,
  };
}

export function pianoRowToTextbook(row: {
  id: string;
  title: string;
  publisher: string;
  author: string | null;
  isbn: string | null;
  level: string;
  sale_price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  is_for_sale: boolean;
  memo: string | null;
  created_at: string;
  updated_at: string;
}): Textbook {
  return {
    id: row.id,
    title: row.title,
    publisher: row.publisher,
    author: row.author || undefined,
    isbn: row.isbn || undefined,
    level: row.level,
    price: row.sale_price,
    salePrice: row.sale_price,
    costPrice: row.cost_price,
    stock: row.stock,
    currentStock: row.stock,
    minStock: row.min_stock,
    isForSale: row.is_for_sale,
    memo: row.memo || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Textbook Sales ───────────────────────────────────────────────

const SALE_STATUS_TO_DB: Record<TextbookSale['status'], PianoTextbookPaymentStatus> = {
  unpaid: 'unpaid',
  partial: 'partial',
  paid: 'paid',
};

const DB_TO_SALE_STATUS: Record<PianoTextbookPaymentStatus, TextbookSale['status']> = {
  unpaid: 'unpaid',
  partial: 'partial',
  paid: 'paid',
};

const APP_TO_DB_PAYMENT: Record<string, DbPaymentMethod> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
};

export function saleToPianoRow(sale: TextbookSale, organizationId: string) {
  const metadata: SaleMetadata = {
    parentId: sale.parentId,
    parentName: sale.parentName,
    parentPhone: sale.parentPhone,
    textbookTitle: sale.textbookTitle,
    studentName: sale.studentName,
    teacherName: sale.teacherName,
  };

  return {
    id: sale.id,
    organization_id: organizationId,
    customer_id: sale.studentId,
    textbook_id: sale.textbookId,
    sale_date: sale.saleDate,
    quantity: sale.quantity,
    unit_price: sale.unitPrice,
    discount: sale.discount,
    total_amount: sale.totalAmount,
    paid_amount: sale.paidAmount,
    status: SALE_STATUS_TO_DB[sale.status],
    payment_method: sale.paymentMethod
      ? APP_TO_DB_PAYMENT[sale.paymentMethod] || 'other'
      : null,
    memo: sale.memo || null,
    staff_id: sale.teacherId || null,
    metadata: metadata as Json,
  };
}

export function pianoRowToSale(row: {
  id: string;
  customer_id: string;
  textbook_id: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  status: PianoTextbookPaymentStatus;
  payment_method: DbPaymentMethod | null;
  memo: string | null;
  staff_id: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}): TextbookSale {
  const meta = (row.metadata || {}) as SaleMetadata;
  const methodReverse: Record<string, TextbookSale['paymentMethod']> = {
    card: 'card',
    transfer: 'transfer',
    cash: 'cash',
    other: 'other',
    online: 'other',
  };

  return {
    id: row.id,
    studentId: row.customer_id,
    studentName: meta.studentName || '',
    parentId: meta.parentId,
    parentName: meta.parentName || '',
    parentPhone: meta.parentPhone || '',
    textbookId: row.textbook_id,
    textbookTitle: meta.textbookTitle || '',
    saleDate: row.sale_date,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    discount: row.discount,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    unpaidAmount: Math.max(0, row.total_amount - row.paid_amount),
    status: DB_TO_SALE_STATUS[row.status],
    paymentMethod: row.payment_method ? methodReverse[row.payment_method] : null,
    memo: row.memo || undefined,
    teacherId: row.staff_id || undefined,
    teacherName: meta.teacherName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── Textbook Payments ────────────────────────────────────────────

export function paymentToPianoRow(payment: TextbookPayment, organizationId: string) {
  return {
    id: payment.id,
    organization_id: organizationId,
    textbook_sale_id: payment.textbookSaleId,
    payment_date: payment.paymentDate,
    amount: payment.amount,
    payment_method: APP_TO_DB_PAYMENT[payment.paymentMethod] || 'cash',
    memo: payment.memo || null,
    receipt_number: payment.receiptNumber || null,
    metadata: {
      studentId: payment.studentId,
      studentName: payment.studentName,
      textbookTitle: payment.textbookTitle,
    } as Json,
  };
}

export function pianoRowToPayment(row: {
  id: string;
  textbook_sale_id: string;
  payment_date: string;
  amount: number;
  payment_method: DbPaymentMethod;
  memo: string | null;
  receipt_number: string | null;
  metadata: Json;
  created_at: string;
}): TextbookPayment {
  const meta = (row.metadata || {}) as {
    studentId?: string;
    studentName?: string;
    textbookTitle?: string;
  };
  const methodReverse: Record<string, TextbookPayment['paymentMethod']> = {
    card: 'card',
    transfer: 'transfer',
    cash: 'cash',
    other: 'other',
    online: 'other',
  };

  return {
    id: row.id,
    textbookSaleId: row.textbook_sale_id,
    studentId: meta.studentId,
    studentName: meta.studentName,
    textbookTitle: meta.textbookTitle,
    paymentDate: row.payment_date,
    amount: row.amount,
    paymentMethod: methodReverse[row.payment_method] || 'cash',
    memo: row.memo || undefined,
    receiptNumber: row.receipt_number || undefined,
    createdAt: row.created_at,
  };
}

// ─── Inventory Transactions ─────────────────────────────────────

const INV_TYPE_TO_DB: Record<TextbookInventoryTransaction['transactionType'], PianoInventoryTransactionType> = {
  inbound: 'inbound',
  sale: 'sale',
  return: 'return',
  adjust: 'adjust',
};

const DB_TO_INV_TYPE: Record<PianoInventoryTransactionType, TextbookInventoryTransaction['transactionType']> = {
  inbound: 'inbound',
  sale: 'sale',
  return: 'return',
  adjust: 'adjust',
};

export function inventoryToPianoRow(tx: TextbookInventoryTransaction, organizationId: string) {
  return {
    id: tx.id,
    organization_id: organizationId,
    textbook_id: tx.textbookId,
    transaction_type: INV_TYPE_TO_DB[tx.transactionType],
    quantity: tx.quantity,
    previous_stock: tx.previousStock,
    current_stock: tx.currentStock,
    reference_id: tx.referenceId || null,
    transaction_date: tx.transactionDate,
    memo: tx.memo || null,
    metadata: { textbookTitle: tx.textbookTitle } as Json,
  };
}

export function pianoRowToInventory(row: {
  id: string;
  textbook_id: string;
  transaction_type: PianoInventoryTransactionType;
  quantity: number;
  previous_stock: number;
  current_stock: number;
  reference_id: string | null;
  transaction_date: string;
  memo: string | null;
  metadata: Json;
  created_at: string;
}): TextbookInventoryTransaction {
  const meta = (row.metadata || {}) as { textbookTitle?: string };
  return {
    id: row.id,
    textbookId: row.textbook_id,
    textbookTitle: meta.textbookTitle || '',
    transactionType: DB_TO_INV_TYPE[row.transaction_type],
    quantity: row.quantity,
    previousStock: row.previous_stock,
    currentStock: row.current_stock,
    referenceId: row.reference_id || undefined,
    transactionDate: row.transaction_date,
    memo: row.memo || undefined,
    createdAt: row.created_at,
  };
}

// ─── Songs ────────────────────────────────────────────────────────

export function songToPianoRow(song: Song, organizationId: string) {
  return {
    id: song.id,
    organization_id: organizationId,
    title: song.title,
    composer: song.composer,
    difficulty: song.difficulty,
    genre: song.genre,
    related_textbook: song.relatedTextbook || null,
    memo: song.memo || null,
    metadata: {} as Json,
  };
}

export function pianoRowToSong(row: {
  id: string;
  title: string;
  composer: string;
  difficulty: string;
  genre: string;
  related_textbook: string | null;
  memo: string | null;
}): Song {
  return {
    id: row.id,
    title: row.title,
    composer: row.composer,
    difficulty: row.difficulty as Song['difficulty'],
    genre: row.genre as Song['genre'],
    relatedTextbook: row.related_textbook || undefined,
    memo: row.memo || undefined,
  };
}

// ─── Expenses ─────────────────────────────────────────────────────

const APP_TO_DB_PAYMENT_EXPENSE: Record<string, DbPaymentMethod> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
};

const DB_TO_APP_PAYMENT_EXPENSE: Record<string, Expense['paymentMethod']> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
  online: 'other',
};

export function expenseToPianoRow(expense: Expense, organizationId: string) {
  return {
    id: expense.id,
    organization_id: organizationId,
    expense_date: expense.date,
    category: expense.category,
    amount: expense.amount,
    payment_method: APP_TO_DB_PAYMENT_EXPENSE[expense.paymentMethod] || 'cash',
    description: expense.description,
    recipient: expense.recipient || null,
    vendor: expense.vendor || null,
    memo: expense.memo || null,
    receipt_memo: expense.receiptMemo || null,
    metadata: {} as Json,
  };
}

export function pianoRowToExpense(row: {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  payment_method: DbPaymentMethod;
  description: string;
  recipient: string | null;
  vendor: string | null;
  memo: string | null;
  receipt_memo: string | null;
}): Expense {
  return {
    id: row.id,
    date: row.expense_date,
    category: row.category as Expense['category'],
    amount: Number(row.amount),
    paymentMethod: DB_TO_APP_PAYMENT_EXPENSE[row.payment_method] || 'cash',
    description: row.description,
    recipient: row.recipient || undefined,
    vendor: row.vendor || undefined,
    memo: row.memo || undefined,
    receiptMemo: row.receipt_memo || undefined,
  };
}
