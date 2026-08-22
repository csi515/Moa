import type {
  Achievement,
  CurriculumItem,
  CurriculumLevel,
  LearningReport,
  StudentCurriculumProgress,
  WeeklyAssignment,
} from '../types/education';
import {
  Student,
  Parent,
  Teacher,
  ClassItem,
  AttendanceRecord,
  TuitionInvoice,
  TextbookSale,
  UnpaidInvoiceItem,
  StudentUnpaidSummary,
  MakeupItem,
  Consultation,
  PracticeRecord,
  LessonRecord,
  Textbook,
  TextbookSale,
  TextbookPayment,
  TextbookInventoryTransaction,
  StudentMonthlyBillingSummary,
  CombinedPaymentRequest,
  PaymentMethod,
  Song,
  AcademyEvent,
  EventParticipantSummary,
  PerformanceVideo,
  Expense,
  AppNotification,
  AcademySettings,
  User,
} from '../types';

import {
  getStorageAdapter,
  STORAGE_KEYS,
  type StorageKey,
} from './adapters';
import { academyEventTypeToVideoType } from '../modules/piano/config/eventLabels';
import type { Booking, BookingStatus, ServiceOffering } from '../core/types/schedule';
import { setIndustryType, getIndustryType } from './adapters/storageContext';
import type { AttendanceSession, CheckInMethod, PinCheckResult } from '../core/attendance/types';
import { isAttendanceModuleEnabled } from '../core/attendance/features';
import {
  assignCustomerPin,
  generateUniquePin,
  toggleCheckInByPinLocal,
} from '../core/attendance/services/attendanceService';
import type { GuardianRelationship, ParentStudentLink } from '../core/parent/types';

type Listener = () => void;

const DEFAULT_SETTINGS: AcademySettings = {
  name: '',
  address: '',
  phone: '',
  directorName: '',
  defaultTuitionFee: 180000,
  defaultPaymentDay: 25,
};

function getItem<T>(key: StorageKey, defaultValue: T): T {
  return getStorageAdapter().getItem(key, defaultValue);
}

function setItem<T>(key: StorageKey, value: T): void {
  getStorageAdapter().setItem(key, value);
}

function generateEntityId(_prefix: string): string {
  return crypto.randomUUID();
}

export const StorageService = {
  /** Supabase org 선택 시 원격 데이터 hydrate */
  async hydrate(organizationId: string, industryType?: string | null): Promise<void> {
    setIndustryType(industryType ?? null);
    await getStorageAdapter().hydrate(organizationId, industryType);
  },

  /** org 전환/로그아웃 시 캐시 초기화 */
  clearOrganization(): void {
    getStorageAdapter().clearOrganization();
  },

  isHydrated(): boolean {
    return getStorageAdapter().isHydrated();
  },

  isHydrating(): boolean {
    return getStorageAdapter().isHydrating();
  },

  subscribe(listener: Listener): () => void {
    return getStorageAdapter().subscribe(listener);
  },

  exportDatabaseJSON(): string {
    const fullDump = {
      students: this.getStudents(),
      parents: this.getParents(),
      teachers: this.getTeachers(),
      classes: this.getClasses(),
      attendance: this.getAttendance(),
      attendanceSessions: this.getAttendanceSessions(),
      customerPins: this.getCustomerPins(),
      parentStudentLinks: this.getParentStudentLinks(),
      invoices: this.getInvoices(),
      expenses: this.getExpenses(),
      incomeEntries: this.getIncomeEntries(),
      consultations: this.getConsultations(),
      practiceRecords: this.getPracticeRecords(),
      lessonRecords: this.getLessonRecords(),
      textbooks: this.getTextbooks(),
      songs: this.getSongs(),
      events: this.getEvents(),
      performanceVideos: this.getPerformanceVideos(),
      notifications: this.getNotifications(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(fullDump, null, 2);
  },

  importDatabaseJSON(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.students) setItem(STORAGE_KEYS.STUDENTS, data.students);
      if (data.parents) setItem(STORAGE_KEYS.PARENTS, data.parents);
      if (data.teachers) setItem(STORAGE_KEYS.TEACHERS, data.teachers);
      if (data.classes) setItem(STORAGE_KEYS.CLASSES, data.classes);
      if (data.attendance) setItem(STORAGE_KEYS.ATTENDANCE, data.attendance);
      if (data.attendanceSessions) setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, data.attendanceSessions);
      if (data.customerPins) setItem(STORAGE_KEYS.CUSTOMER_PINS, data.customerPins);
      if (data.parentStudentLinks) setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, data.parentStudentLinks);
      if (data.invoices) setItem(STORAGE_KEYS.INVOICES, data.invoices);
      if (data.expenses) setItem(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.incomeEntries) setItem(STORAGE_KEYS.INCOME_ENTRIES, data.incomeEntries);
      if (data.consultations) setItem(STORAGE_KEYS.CONSULTATIONS, data.consultations);
      if (data.practiceRecords) setItem(STORAGE_KEYS.PRACTICE_RECORDS, data.practiceRecords);
      if (data.lessonRecords) setItem(STORAGE_KEYS.LESSON_RECORDS, data.lessonRecords);
      if (data.textbooks) setItem(STORAGE_KEYS.TEXTBOOKS, data.textbooks);
      if (data.songs) setItem(STORAGE_KEYS.SONGS, data.songs);
      if (data.events) setItem(STORAGE_KEYS.EVENTS, data.events);
      if (data.performanceVideos) setItem(STORAGE_KEYS.PERFORMANCE_VIDEOS, data.performanceVideos);
      if (data.notifications) setItem(STORAGE_KEYS.NOTIFICATIONS, data.notifications);
      if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  // Active User / Role
  getActiveUser(): User {
    return getItem<User>(STORAGE_KEYS.ACTIVE_USER, {
      id: 'owner',
      name: '원장님',
      role: 'owner',
      email: '',
    });
  },

  setActiveUser(user: User): void {
    setItem(STORAGE_KEYS.ACTIVE_USER, user);
  },

  // Settings
  getSettings(): AcademySettings {
    return getItem<AcademySettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  updateSettings(settings: Partial<AcademySettings>): AcademySettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    setItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },

  // Students
  getStudents(): Student[] {
    const raw = getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
    return raw.map((s) => this.deriveStudentGuardians(s));
  },

  /** links 미적용 raw 학생 목록 (내부용) */
  getStudentsRaw(): Student[] {
    return getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
  },

  deriveStudentGuardians(student: Student): Student {
    const links = this.getParentStudentLinks().filter((l) => l.studentId === student.id);
    const primary = links.find((l) => l.isPrimary) || links[0];
    if (!primary) return student;
    const parent = this.getParents().find((p) => p.id === primary.parentId);
    if (!parent) return student;
    return {
      ...student,
      parentId: parent.id,
      parentName: parent.name,
      parentPhone: parent.phone,
    };
  },

  getStudentById(id: string): Student | undefined {
    return this.getStudents().find((s) => s.id === id);
  },

  saveStudent(student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Student {
    const list = this.getStudentsRaw();
    const now = new Date().toISOString();
    let saved: Student;

    if (student.id) {
      const idx = list.findIndex((s) => s.id === student.id);
      if (idx >= 0) {
        saved = {
          ...list[idx],
          ...student,
          id: student.id,
          updatedAt: now
        };
        list[idx] = saved;
      } else {
        saved = {
          ...student,
          id: student.id,
          createdAt: now,
          updatedAt: now
        };
        list.unshift(saved);
      }
    } else {
      const autoNum = `P-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;
      saved = {
        ...student,
        id: generateEntityId('s'),
        studentNumber: student.studentNumber || autoNum,
        createdAt: now,
        updatedAt: now
      };
      list.unshift(saved);
    }

    // Auto-generate invoice if new active student
    if (!student.id && saved.status === 'active') {
      this.createInvoiceForStudent(saved);
    }

    setItem(STORAGE_KEYS.STUDENTS, list);
    return saved;
  },

  deleteStudent(id: string): boolean {
    const list = this.getStudents();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.STUDENTS, filtered);
      return true;
    }
    return false;
  },

  // Parents
  getParents(): Parent[] {
    return getItem<Parent[]>(STORAGE_KEYS.PARENTS, []);
  },

  saveParent(parent: Omit<Parent, 'id' | 'createdAt'> & { id?: string }): Parent {
    const list = this.getParents();
    let saved: Parent;
    if (parent.id) {
      const idx = list.findIndex((p) => p.id === parent.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...parent, id: parent.id };
        list[idx] = saved;
      } else {
        saved = { ...parent, id: parent.id, createdAt: new Date().toISOString().slice(0, 10) };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...parent,
        id: generateEntityId('p'),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.PARENTS, list);
    return saved;
  },

  deleteParent(id: string): boolean {
    const list = this.getParents();
    const filtered = list.filter((p) => p.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.PARENTS, filtered);
      return true;
    }
    return false;
  },

  // Teachers
  getTeachers(): Teacher[] {
    return getItem<Teacher[]>(STORAGE_KEYS.TEACHERS, []);
  },

  saveTeacher(teacher: Omit<Teacher, 'id'> & { id?: string }): Teacher {
    const list = this.getTeachers();
    let saved: Teacher;
    if (teacher.id) {
      const idx = list.findIndex((t) => t.id === teacher.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...teacher, id: teacher.id };
        list[idx] = saved;
      } else {
        saved = { ...teacher, id: teacher.id };
        list.push(saved);
      }
    } else {
      saved = {
        ...teacher,
        id: generateEntityId('t'),
      };
      list.push(saved);
    }
    setItem(STORAGE_KEYS.TEACHERS, list);
    return saved;
  },

  deleteTeacher(id: string): boolean {
    const list = this.getTeachers();
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.TEACHERS, filtered);
      return true;
    }
    return false;
  },

  // Classes
  getClasses(): ClassItem[] {
    return getItem<ClassItem[]>(STORAGE_KEYS.CLASSES, []);
  },

  saveClass(cls: Omit<ClassItem, 'id'> & { id?: string }): ClassItem {
    const list = this.getClasses();
    let saved: ClassItem;
    if (cls.id) {
      const idx = list.findIndex((c) => c.id === cls.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...cls, id: cls.id };
        list[idx] = saved;
      } else {
        saved = { ...cls, id: cls.id };
        list.push(saved);
      }
    } else {
      saved = {
        ...cls,
        id: generateEntityId('c')
      };
      list.push(saved);
    }
    setItem(STORAGE_KEYS.CLASSES, list);
    return saved;
  },

  deleteClass(id: string): boolean {
    const list = this.getClasses();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.CLASSES, filtered);
      return true;
    }
    return false;
  },

  // Attendance
  getAttendance(): AttendanceRecord[] {
    return getItem<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
  },

  saveAttendanceRecord(record: Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string }): AttendanceRecord {
    const list = this.getAttendance();
    const now = new Date().toISOString();
    let saved: AttendanceRecord;

    // Check if duplicate for same date + student + class
    const existingIdx = record.id
      ? list.findIndex((r) => r.id === record.id)
      : list.findIndex((r) => r.date === record.date && r.studentId === record.studentId && r.classId === record.classId);

    if (existingIdx >= 0) {
      saved = { ...list[existingIdx], ...record, id: list[existingIdx].id };
      if (saved.status === 'absent') {
        saved.makeUpRequired = true;
      }
      list[existingIdx] = saved;
    } else {
      saved = {
        ...record,
        id: generateEntityId('att'),
        createdAt: now
      };
      if (record.status === 'absent') {
        saved.makeUpRequired = true;
      }
      list.unshift(saved);
    }

    setItem(STORAGE_KEYS.ATTENDANCE, list);
    return saved;
  },

  batchSaveAttendance(records: (Omit<AttendanceRecord, 'id' | 'createdAt'> & { id?: string })[]): void {
    const list = this.getAttendance();
    const now = new Date().toISOString();

    records.forEach((record) => {
      const idx = record.id
        ? list.findIndex((r) => r.id === record.id)
        : list.findIndex((r) => r.date === record.date && r.studentId === record.studentId && r.classId === record.classId);

      if (idx >= 0) {
        list[idx] = { ...list[idx], ...record, id: list[idx].id };
      } else {
        list.unshift({
          ...record,
          id: generateEntityId('att'),
          createdAt: now
        });
      }
    });

    setItem(STORAGE_KEYS.ATTENDANCE, list);
  },

  deleteAttendance(id: string): boolean {
    const list = this.getAttendance();
    const filtered = list.filter((r) => r.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.ATTENDANCE, filtered);
      return true;
    }
    return false;
  },

  // Attendance sessions (PIN check-in/out)
  getAttendanceSessions(): AttendanceSession[] {
    return getItem<AttendanceSession[]>(STORAGE_KEYS.ATTENDANCE_SESSIONS, []);
  },

  saveAttendanceSessions(sessions: AttendanceSession[]): void {
    setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, sessions);
  },

  saveAttendanceSession(session: AttendanceSession): AttendanceSession {
    const list = this.getAttendanceSessions();
    const idx = list.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.unshift(session);
    }
    setItem(STORAGE_KEYS.ATTENDANCE_SESSIONS, list);
    return session;
  },

  getCustomerPins(): { customerId: string; pinHash: string }[] {
    return getItem(STORAGE_KEYS.CUSTOMER_PINS, []);
  },

  hasCustomerPin(customerId: string): boolean {
    return this.getCustomerPins().some((p) => p.customerId === customerId);
  },

  setCustomerPinHash(customerId: string, pinHash: string): void {
    const list = this.getCustomerPins().filter((p) => p.customerId !== customerId);
    list.push({ customerId, pinHash });
    setItem(STORAGE_KEYS.CUSTOMER_PINS, list);

    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === customerId);
    if (idx >= 0) {
      students[idx] = { ...students[idx], checkInPinSet: true };
      setItem(STORAGE_KEYS.STUDENTS, students);
    }
  },

  clearCustomerPin(customerId: string): void {
    const list = this.getCustomerPins().filter((p) => p.customerId !== customerId);
    setItem(STORAGE_KEYS.CUSTOMER_PINS, list);

    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === customerId);
    if (idx >= 0) {
      students[idx] = { ...students[idx], checkInPinSet: false };
      setItem(STORAGE_KEYS.STUDENTS, students);
    }
  },

  async setCustomerPin(
    customerId: string,
    pin: string,
    organizationId: string
  ): Promise<{ ok: true } | { ok: false; error: 'invalid_pin_format' | 'pin_already_used' }> {
    const result = await assignCustomerPin({
      organizationId,
      customerId,
      pin,
      pinRecords: this.getCustomerPins(),
    });
    if (!result.ok) return result;
    this.setCustomerPinHash(customerId, result.pinHash);
    return { ok: true };
  },

  async generateCustomerPin(
    customerId: string,
    organizationId: string
  ): Promise<{ pin: string }> {
    const { pin, pinHash } = await generateUniquePin({
      organizationId,
      customerId,
      pinRecords: this.getCustomerPins(),
    });
    this.setCustomerPinHash(customerId, pinHash);
    return { pin };
  },

  async toggleCheckInByPin(
    pin: string,
    method: CheckInMethod,
    organizationId: string
  ): Promise<PinCheckResult> {
    const settings = this.getSettings();
    const industry = getIndustryType() || 'piano';
    const moduleEnabled = isAttendanceModuleEnabled(settings, industry);

    const { result, sessions } = await toggleCheckInByPinLocal({
      organizationId,
      pin,
      method,
      pinRecords: this.getCustomerPins(),
      sessions: this.getAttendanceSessions(),
      students: this.getStudents(),
      moduleEnabled,
    });

    if (result.success) {
      this.saveAttendanceSessions(sessions);
    }

    return result;
  },

  // Tuition Invoices & Payments
  normalizeInvoiceStatus(inv: TuitionInvoice): TuitionInvoice {
    if (inv.status === 'paid') return inv;
    const today = new Date().toISOString().slice(0, 10);
    if (inv.unpaidAmount > 0 && inv.dueDate < today) {
      return { ...inv, status: 'overdue' };
    }
    return inv;
  },

  getInvoices(): TuitionInvoice[] {
    return getItem<TuitionInvoice[]>(STORAGE_KEYS.INVOICES, []).map((inv) =>
      this.normalizeInvoiceStatus(inv)
    );
  },

  saveInvoice(inv: Omit<TuitionInvoice, 'id'> & { id?: string }): TuitionInvoice {
    const list = this.getInvoices();
    let saved: TuitionInvoice;
    if (inv.id) {
      const idx = list.findIndex((i) => i.id === inv.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...inv, id: inv.id };
        list[idx] = saved;
      } else {
        saved = { ...inv, id: inv.id };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...inv,
        id: generateEntityId('inv')
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.INVOICES, list);
    return saved;
  },

  deleteInvoice(id: string): boolean {
    const list = this.getInvoices();
    const filtered = list.filter((i) => i.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.INVOICES, filtered);
      return true;
    }
    return false;
  },

  recordPayment(invoiceId: string, amount: number, method: 'card' | 'transfer' | 'cash' | 'other', notes?: string): TuitionInvoice | null {
    const list = this.getInvoices();
    const idx = list.findIndex((i) => i.id === invoiceId);
    if (idx === -1) return null;

    const inv = list[idx];
    const newPaidAmount = inv.paidAmount + amount;
    const newUnpaidAmount = Math.max(0, inv.totalAmount - newPaidAmount);
    const newStatus = newUnpaidAmount === 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
    const nowStr = new Date().toISOString().slice(0, 10);
    const receiptNum = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

    const updated: TuitionInvoice = {
      ...inv,
      paidAmount: newPaidAmount,
      unpaidAmount: newUnpaidAmount,
      status: newStatus,
      paymentMethod: method,
      paidAt: nowStr,
      notes: notes ? `${inv.notes || ''} [${nowStr}] ${notes}`.trim() : inv.notes,
      receiptNumber: inv.receiptNumber || receiptNum
    };

    list[idx] = updated;
    setItem(STORAGE_KEYS.INVOICES, list);
    return updated;
  },

  createInvoiceForStudent(student: Student, yearMonth?: string): TuitionInvoice {
    const ym = yearMonth || new Date().toISOString().slice(0, 7);
    const dueDay = String(student.paymentDay || 10).padStart(2, '0');
    const dueDate = `${ym}-${dueDay}`;

    const newInv: TuitionInvoice = {
      id: generateEntityId('inv'),
      studentId: student.id,
      studentName: student.name,
      yearMonth: ym,
      baseFee: student.tuitionFee,
      discount: 0,
      textbookFee: 0,
      extraFee: 0,
      totalAmount: student.tuitionFee,
      paidAmount: 0,
      unpaidAmount: student.tuitionFee,
      dueDate: dueDate,
      status: 'unpaid',
      notes: `${ym}월 정기 수강료`
    };

    return this.saveInvoice(newInv);
  },

  generateMonthlyInvoicesForAllActive(yearMonth: string): number {
    const students = this.getStudents().filter((s) => s.status === 'active');
    const currentInvoices = this.getInvoices();
    let generatedCount = 0;

    students.forEach((student) => {
      const alreadyHas = currentInvoices.some((i) => i.studentId === student.id && i.yearMonth === yearMonth);
      if (!alreadyHas) {
        this.createInvoiceForStudent(student, yearMonth);
        generatedCount++;
      }
    });

    return generatedCount;
  },

  // Expenses
  getExpenses(): Expense[] {
    return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
  },

  saveExpense(exp: Omit<Expense, 'id'> & { id?: string }): Expense {
    const list = this.getExpenses();
    let saved: Expense;
    if (exp.id) {
      const idx = list.findIndex((e) => e.id === exp.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...exp, id: exp.id };
        list[idx] = saved;
      } else {
        saved = { ...exp, id: exp.id };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...exp,
        id: generateEntityId('exp')
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.EXPENSES, list);
    return saved;
  },

  deleteExpense(id: string): boolean {
    const list = this.getExpenses();
    const filtered = list.filter((e) => e.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.EXPENSES, filtered);
      return true;
    }
    return false;
  },

  // Income entries (core finance)
  getIncomeEntries(): IncomeEntry[] {
    return getItem<IncomeEntry[]>(STORAGE_KEYS.INCOME_ENTRIES, []);
  },

  saveIncomeEntry(entry: Omit<IncomeEntry, 'id'> & { id?: string }): IncomeEntry {
    const list = this.getIncomeEntries();
    let saved: IncomeEntry;
    if (entry.id) {
      const idx = list.findIndex((e) => e.id === entry.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...entry, id: entry.id };
        list[idx] = saved;
      } else {
        saved = { ...entry, id: entry.id };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...entry,
        id: generateEntityId('inc'),
        sourceType: entry.sourceType || 'manual',
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.INCOME_ENTRIES, list);
    return saved;
  },

  deleteIncomeEntry(id: string): boolean {
    const list = this.getIncomeEntries();
    const filtered = list.filter((e) => e.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.INCOME_ENTRIES, filtered);
      return true;
    }
    return false;
  },

  /** 업종별 재무 요약 (수입·지출·순수익) */
  getFinanceSummary(industry: string = 'piano'): FinanceSummary {
    const expenses = this.getExpenses();
    const incomeEntries = this.getIncomeEntries();
    const currentYearMonth = new Date().toISOString().slice(0, 7);

    const getLinkedIncomeForMonth = (ym: string): number => {
      if (industry !== 'piano') return 0;
      const tuitionPaid = this.getInvoices()
        .filter((i) => i.yearMonth === ym)
        .reduce((sum, i) => sum + i.paidAmount, 0);
      const textbookPaid = this.getTextbookSales()
        .filter((s) => s.saleDate.startsWith(ym))
        .reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      return tuitionPaid + textbookPaid;
    };

    const getManualIncomeForMonth = (ym: string): number =>
      incomeEntries
        .filter((e) => e.date.startsWith(ym))
        .reduce((sum, e) => sum + e.amount, 0);

    const getExpenseForMonth = (ym: string): number =>
      expenses.filter((e) => e.date.startsWith(ym)).reduce((sum, e) => sum + e.amount, 0);

    const manualIncomeThisMonth = getManualIncomeForMonth(currentYearMonth);
    const linkedIncomeThisMonth = getLinkedIncomeForMonth(currentYearMonth);
    const totalIncomeThisMonth = manualIncomeThisMonth + linkedIncomeThisMonth;
    const totalExpenseThisMonth = getExpenseForMonth(currentYearMonth);

    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }

    const monthlyTrend = months.map((ym) => {
      const income = getManualIncomeForMonth(ym) + getLinkedIncomeForMonth(ym);
      const expense = getExpenseForMonth(ym);
      return {
        yearMonth: ym,
        monthLabel: `${parseInt(ym.slice(5, 7), 10)}월`,
        income,
        expense,
        net: income - expense,
      };
    });

    return {
      currentYearMonth,
      totalIncomeThisMonth,
      totalExpenseThisMonth,
      netProfitThisMonth: totalIncomeThisMonth - totalExpenseThisMonth,
      linkedIncomeThisMonth,
      manualIncomeThisMonth,
      monthlyTrend,
    };
  },

  // Consultations
  getConsultations(): Consultation[] {
    return getItem<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
  },

  saveConsultation(cst: Omit<Consultation, 'id' | 'createdAt'> & { id?: string }): Consultation {
    const list = this.getConsultations();
    const now = new Date().toISOString();
    let saved: Consultation;
    if (cst.id) {
      const idx = list.findIndex((c) => c.id === cst.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...cst, id: cst.id };
        list[idx] = saved;
      } else {
        saved = { ...cst, id: cst.id, createdAt: now };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...cst,
        id: generateEntityId('cst'),
        createdAt: now
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.CONSULTATIONS, list);
    return saved;
  },

  deleteConsultation(id: string): boolean {
    const list = this.getConsultations();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.CONSULTATIONS, filtered);
      return true;
    }
    return false;
  },

  // Practice Records
  getPracticeRecords(): PracticeRecord[] {
    return getItem<PracticeRecord[]>(STORAGE_KEYS.PRACTICE_RECORDS, []);
  },

  savePracticeRecord(rec: Omit<PracticeRecord, 'id' | 'createdAt'> & { id?: string }): PracticeRecord {
    const list = this.getPracticeRecords();
    const now = new Date().toISOString();
    let saved: PracticeRecord;
    if (rec.id) {
      const idx = list.findIndex((r) => r.id === rec.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...rec, id: rec.id };
        list[idx] = saved;
      } else {
        saved = { ...rec, id: rec.id, createdAt: now };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...rec,
        id: generateEntityId('pr'),
        createdAt: now
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.PRACTICE_RECORDS, list);
    return saved;
  },

  deletePracticeRecord(id: string): boolean {
    const list = this.getPracticeRecords();
    const filtered = list.filter((r) => r.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.PRACTICE_RECORDS, filtered);
      return true;
    }
    return false;
  },

  // Lesson Records
  getLessonRecords(): LessonRecord[] {
    return getItem<LessonRecord[]>(STORAGE_KEYS.LESSON_RECORDS, []);
  },

  saveLessonRecord(rec: Omit<LessonRecord, 'id' | 'createdAt'> & { id?: string }): LessonRecord {
    const list = this.getLessonRecords();
    const now = new Date().toISOString();
    let saved: LessonRecord;
    if (rec.id) {
      const idx = list.findIndex((r) => r.id === rec.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...rec, id: rec.id };
        list[idx] = saved;
      } else {
        saved = { ...rec, id: rec.id, createdAt: now };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...rec,
        id: generateEntityId('lr'),
        createdAt: now
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.LESSON_RECORDS, list);
    return saved;
  },

  deleteLessonRecord(id: string): boolean {
    const list = this.getLessonRecords();
    const filtered = list.filter((r) => r.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.LESSON_RECORDS, filtered);
      return true;
    }
    return false;
  },

  // ==========================================
  // 📚 1. Textbooks Management
  // ==========================================
  getTextbooks(): Textbook[] {
    return getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
  },

  getTextbookById(id: string): Textbook | undefined {
    return this.getTextbooks().find((t) => t.id === id);
  },

  saveTextbook(tb: Partial<Textbook> & { title: string }): Textbook {
    const list = this.getTextbooks();
    const nowStr = new Date().toISOString();
    const price = Number(tb.salePrice ?? tb.price ?? 15000);
    const cost = Number(tb.costPrice ?? Math.round(price * 0.6));
    const stock = Number(tb.stock ?? 0);
    const minStock = Number(tb.minStock ?? 5);

    let saved: Textbook;
    if (tb.id) {
      const idx = list.findIndex((t) => t.id === tb.id);
      if (idx >= 0) {
        const prev = list[idx];
        saved = {
          ...prev,
          ...tb,
          price,
          salePrice: price,
          costPrice: cost,
          stock,
          minStock,
          isForSale: tb.isForSale !== undefined ? tb.isForSale : true,
          updatedAt: nowStr
        };
        list[idx] = saved;
      } else {
        saved = {
          id: tb.id,
          title: tb.title,
          publisher: tb.publisher || '기타출판',
          author: tb.author || '',
          isbn: tb.isbn || '',
          level: tb.level || '기초',
          price,
          salePrice: price,
          costPrice: cost,
          stock,
          minStock,
          isForSale: tb.isForSale !== undefined ? tb.isForSale : true,
          memo: tb.memo || '',
          createdAt: nowStr,
          updatedAt: nowStr
        };
        list.push(saved);
      }
    } else {
      const newId = `tb-${Date.now()}`;
      saved = {
        id: newId,
        title: tb.title,
        publisher: tb.publisher || '기타출판',
        author: tb.author || '',
        isbn: tb.isbn || '',
        level: tb.level || '기초',
        price,
        salePrice: price,
        costPrice: cost,
        stock,
        minStock,
        isForSale: tb.isForSale !== undefined ? tb.isForSale : true,
        memo: tb.memo || '',
        createdAt: nowStr,
        updatedAt: nowStr
      };
      list.push(saved);

      // If initial stock > 0, record initial inbound transaction
      if (stock > 0) {
        this.recordInventoryTransaction({
          textbookId: newId,
          textbookTitle: saved.title,
          transactionType: 'inbound',
          quantity: stock,
          previousStock: 0,
          currentStock: stock,
          transactionDate: new Date().toISOString().slice(0, 10),
          memo: '신규 교재 등록 시 초기 재고 설정'
        });
      }
    }
    setItem(STORAGE_KEYS.TEXTBOOKS, list);
    return saved;
  },

  deleteTextbook(id: string): boolean {
    const list = this.getTextbooks();
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.TEXTBOOKS, filtered);
      return true;
    }
    return false;
  },

  adjustStock(
    textbookId: string,
    quantityDelta: number,
    transactionType: 'inbound' | 'adjust' | 'return' = 'inbound',
    memo?: string
  ): { textbook: Textbook; transaction: TextbookInventoryTransaction } | null {
    const list = this.getTextbooks();
    const idx = list.findIndex((t) => t.id === textbookId);
    if (idx === -1) return null;

    const tb = list[idx];
    const prevStock = tb.stock;
    const newStock = Math.max(0, prevStock + quantityDelta);

    const updatedTb: Textbook = {
      ...tb,
      stock: newStock,
      updatedAt: new Date().toISOString()
    };
    list[idx] = updatedTb;
    setItem(STORAGE_KEYS.TEXTBOOKS, list);

    const tx = this.recordInventoryTransaction({
      textbookId: tb.id,
      textbookTitle: tb.title,
      transactionType,
      quantity: quantityDelta,
      previousStock: prevStock,
      currentStock: newStock,
      transactionDate: new Date().toISOString().slice(0, 10),
      memo: memo || `${transactionType === 'inbound' ? '교재 입고' : transactionType === 'return' ? '반품 입고' : '재고 수동 조정'}`
    });

    return { textbook: updatedTb, transaction: tx };
  },

  // ==========================================
  // 🛒 2. Textbook Sales & Automatic Stock Deduction
  // ==========================================
  getTextbookSales(): TextbookSale[] {
    return getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
  },

  getTextbookSaleById(id: string): TextbookSale | undefined {
    return this.getTextbookSales().find((s) => s.id === id);
  },

  getSalesByStudentId(studentId: string): TextbookSale[] {
    return this.getTextbookSales().filter((s) => s.studentId === studentId);
  },

  createSale(data: {
    studentId: string;
    textbookId: string;
    quantity: number;
    unitPrice?: number;
    discount?: number;
    initialPaymentAmount?: number;
    paymentMethod?: PaymentMethod | null;
    saleDate?: string;
    memo?: string;
    teacherId?: string;
    teacherName?: string;
  }): { sale: TextbookSale; payment?: TextbookPayment; transaction: TextbookInventoryTransaction } {
    const students = this.getStudents();
    const student = students.find((s) => s.id === data.studentId);
    const textbooks = this.getTextbooks();
    const tb = textbooks.find((t) => t.id === data.textbookId);

    if (!tb) {
      throw new Error('선택한 교재 정보를 찾을 수 없습니다.');
    }
    if (!student) {
      throw new Error('선택한 원생 정보를 찾을 수 없습니다.');
    }

    const qty = Math.max(1, Number(data.quantity) || 1);
    const unitPrice = Number(data.unitPrice ?? tb.salePrice ?? tb.price ?? 15000);
    const discount = Math.max(0, Number(data.discount) || 0);
    const totalAmount = Math.max(0, qty * unitPrice - discount);
    const initialPaid = Math.min(totalAmount, Math.max(0, Number(data.initialPaymentAmount) || 0));
    const unpaidAmount = Math.max(0, totalAmount - initialPaid);

    const status: 'unpaid' | 'partial' | 'paid' =
      unpaidAmount === 0 ? 'paid' : initialPaid > 0 ? 'partial' : 'unpaid';

    const now = new Date();
    const nowIso = now.toISOString();
    const saleDate = data.saleDate || nowIso.slice(0, 10);
    const saleId = `ts-${Date.now()}`;

    const newSale: TextbookSale = {
      id: saleId,
      studentId: student.id,
      studentName: student.name,
      parentId: student.parentId,
      parentName: student.parentName || '학부모',
      parentPhone: student.parentPhone || '',
      textbookId: tb.id,
      textbookTitle: tb.title,
      saleDate,
      quantity: qty,
      unitPrice,
      discount,
      totalAmount,
      paidAmount: initialPaid,
      unpaidAmount,
      status,
      paymentMethod: initialPaid > 0 ? (data.paymentMethod || 'card') : null,
      memo: data.memo || '',
      teacherId: data.teacherId || student.teacherId,
      teacherName: data.teacherName || student.teacherName,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    // 1) Save Sale Record
    const salesList = this.getTextbookSales();
    salesList.unshift(newSale);
    setItem(STORAGE_KEYS.TEXTBOOK_SALES, salesList);

    // 2) Deduct Inventory & Record Inventory Transaction
    const prevStock = tb.stock;
    const currentStock = Math.max(0, prevStock - qty);
    const tbIdx = textbooks.findIndex((t) => t.id === tb.id);
    if (tbIdx >= 0) {
      textbooks[tbIdx] = {
        ...tb,
        stock: currentStock,
        updatedAt: nowIso
      };
      setItem(STORAGE_KEYS.TEXTBOOKS, textbooks);
    }

    const tx = this.recordInventoryTransaction({
      textbookId: tb.id,
      textbookTitle: tb.title,
      transactionType: 'sale',
      quantity: -qty,
      previousStock: prevStock,
      currentStock,
      referenceId: saleId,
      transactionDate: saleDate,
      memo: `${student.name} 원생에게 ${qty}권 판매 출고`
    });

    // 3) If initial payment > 0, record TextbookPayment history
    let payment: TextbookPayment | undefined;
    if (initialPaid > 0) {
      payment = this.saveTextbookPaymentDirect({
        textbookSaleId: saleId,
        studentId: student.id,
        studentName: student.name,
        textbookTitle: tb.title,
        paymentDate: saleDate,
        amount: initialPaid,
        paymentMethod: data.paymentMethod || 'card',
        memo: '교재 판매 시 현장 수납'
      });
    }

    return { sale: newSale, payment, transaction: tx };
  },

  cancelSale(saleId: string, reason?: string): boolean {
    const sales = this.getTextbookSales();
    const idx = sales.findIndex((s) => s.id === saleId);
    if (idx === -1) return false;

    const sale = sales[idx];
    const textbooks = this.getTextbooks();
    const tbIdx = textbooks.findIndex((t) => t.id === sale.textbookId);

    // Restore stock
    if (tbIdx >= 0) {
      const tb = textbooks[tbIdx];
      const prevStock = tb.stock;
      const currentStock = prevStock + sale.quantity;
      textbooks[tbIdx] = {
        ...tb,
        stock: currentStock,
        updatedAt: new Date().toISOString()
      };
      setItem(STORAGE_KEYS.TEXTBOOKS, textbooks);

      this.recordInventoryTransaction({
        textbookId: tb.id,
        textbookTitle: tb.title,
        transactionType: 'return',
        quantity: sale.quantity,
        previousStock: prevStock,
        currentStock,
        referenceId: sale.id,
        transactionDate: new Date().toISOString().slice(0, 10),
        memo: `판매 취소/반품 처리: ${sale.studentName} (${reason || '사유 미입력'})`
      });
    }

    // Remove or cancel sale
    sales.splice(idx, 1);
    setItem(STORAGE_KEYS.TEXTBOOK_SALES, sales);

    // Delete associated payments
    const payments = this.getTextbookPayments();
    const remainingPayments = payments.filter((p) => p.textbookSaleId !== saleId);
    setItem(STORAGE_KEYS.TEXTBOOK_PAYMENTS, remainingPayments);

    return true;
  },

  // ==========================================
  // 💳 3. Textbook Payment & Partial Payment History
  // ==========================================
  getTextbookPayments(): TextbookPayment[] {
    return getItem<TextbookPayment[]>(STORAGE_KEYS.TEXTBOOK_PAYMENTS, []);
  },

  getPaymentsBySaleId(saleId: string): TextbookPayment[] {
    return this.getTextbookPayments().filter((p) => p.textbookSaleId === saleId);
  },

  getPaymentsByStudentId(studentId: string): TextbookPayment[] {
    return this.getTextbookPayments().filter((p) => p.studentId === studentId);
  },

  saveTextbookPaymentDirect(data: Omit<TextbookPayment, 'id' | 'createdAt' | 'receiptNumber'>): TextbookPayment {
    const payments = this.getTextbookPayments();
    const now = new Date();
    const ymStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const randNum = String(Math.floor(Math.random() * 900) + 100);
    const receiptNumber = `RCP-TB-${ymStr}-${randNum}`;

    const newPayment: TextbookPayment = {
      ...data,
      id: generateEntityId('tp'),
      receiptNumber,
      createdAt: now.toISOString()
    };

    payments.unshift(newPayment);
    setItem(STORAGE_KEYS.TEXTBOOK_PAYMENTS, payments);
    return newPayment;
  },

  recordTextbookPayment(
    saleId: string,
    amount: number,
    paymentMethod: PaymentMethod = 'card',
    paymentDate?: string,
    memo?: string
  ): { payment: TextbookPayment; updatedSale: TextbookSale } {
    const sales = this.getTextbookSales();
    const idx = sales.findIndex((s) => s.id === saleId);
    if (idx === -1) {
      throw new Error('해당 교재 판매 내역을 찾을 수 없습니다.');
    }

    const sale = sales[idx];
    if (sale.unpaidAmount <= 0) {
      throw new Error('이미 전액 납부 완료된 교재입니다.');
    }

    // Limit amount to unpaidAmount
    const payAmount = Math.min(amount, sale.unpaidAmount);
    if (payAmount <= 0) {
      throw new Error('납부 금액은 0원보다 커야 합니다.');
    }

    const newPaidAmount = sale.paidAmount + payAmount;
    const newUnpaidAmount = Math.max(0, sale.totalAmount - newPaidAmount);
    const newStatus: 'unpaid' | 'partial' | 'paid' = newUnpaidAmount === 0 ? 'paid' : 'partial';
    const pDate = paymentDate || new Date().toISOString().slice(0, 10);

    const updatedSale: TextbookSale = {
      ...sale,
      paidAmount: newPaidAmount,
      unpaidAmount: newUnpaidAmount,
      status: newStatus,
      paymentMethod: paymentMethod,
      updatedAt: new Date().toISOString()
    };
    sales[idx] = updatedSale;
    setItem(STORAGE_KEYS.TEXTBOOK_SALES, sales);

    const payment = this.saveTextbookPaymentDirect({
      textbookSaleId: sale.id,
      studentId: sale.studentId,
      studentName: sale.studentName,
      textbookTitle: sale.textbookTitle,
      paymentDate: pDate,
      amount: payAmount,
      paymentMethod,
      memo: memo || (newStatus === 'paid' ? '교재비 전액 완납' : `교재비 부분 납부 (잔액 ₩${newUnpaidAmount.toLocaleString()})`)
    });

    return { payment, updatedSale };
  },

  // ==========================================
  // 📦 4. Textbook Inventory Transactions
  // ==========================================
  getTextbookInventoryTransactions(): TextbookInventoryTransaction[] {
    return getItem<TextbookInventoryTransaction[]>(STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS, []);
  },

  getTransactionsByTextbookId(textbookId: string): TextbookInventoryTransaction[] {
    return this.getTextbookInventoryTransactions().filter((t) => t.textbookId === textbookId);
  },

  recordInventoryTransaction(
    tx: Omit<TextbookInventoryTransaction, 'id' | 'createdAt'>
  ): TextbookInventoryTransaction {
    const list = this.getTextbookInventoryTransactions();
    const newTx: TextbookInventoryTransaction = {
      ...tx,
      id: generateEntityId('tit'),
      createdAt: new Date().toISOString()
    };
    list.unshift(newTx);
    setItem(STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS, list);
    return newTx;
  },

  // ==========================================
  // 📊 5. Combined Tuition & Textbook Billing
  // ==========================================
  getStudentBillingSummary(studentId: string, yearMonth?: string): StudentMonthlyBillingSummary {
    const ym = yearMonth || new Date().toISOString().slice(0, 7);
    const students = this.getStudents();
    const student = students.find((s) => s.id === studentId);
    const studentName = student ? student.name : '미상 원생';

    // 1. Tuition
    const invoices = this.getInvoices().filter(
      (inv) => inv.studentId === studentId && (!yearMonth || inv.yearMonth === ym)
    );
    const tuitionBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const tuitionPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const tuitionUnpaid = Math.max(0, tuitionBilled - tuitionPaid);
    const tuitionStatus =
      invoices.length === 0
        ? 'unpaid'
        : tuitionUnpaid === 0
        ? 'paid'
        : tuitionPaid > 0
        ? 'partial'
        : 'unpaid';

    // 2. Textbook Sales (all active or this month)
    const sales = this.getTextbookSales().filter(
      (s) => s.studentId === studentId && (!yearMonth || s.saleDate.startsWith(ym))
    );
    const textbookBilled = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const textbookPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const textbookUnpaid = Math.max(0, textbookBilled - textbookPaid);
    const textbookStatus: 'unpaid' | 'partial' | 'paid' =
      sales.length === 0
        ? 'paid'
        : textbookUnpaid === 0
        ? 'paid'
        : textbookPaid > 0
        ? 'partial'
        : 'unpaid';

    return {
      studentId,
      studentName,
      yearMonth: ym,
      tuitionBilled,
      tuitionPaid,
      tuitionUnpaid,
      tuitionStatus,
      tuitionTotal: tuitionBilled,
      textbookBilled,
      textbookPaid,
      textbookUnpaid,
      textbookStatus,
      textbookTotal: textbookBilled,
      totalBilled: tuitionBilled + textbookBilled,
      totalPaid: tuitionPaid + textbookPaid,
      totalUnpaid: tuitionUnpaid + textbookUnpaid,
      grandTotal: tuitionBilled + textbookBilled,
      grandPaid: tuitionPaid + textbookPaid,
      grandUnpaid: tuitionUnpaid + textbookUnpaid,
      invoices,
      textbookSales: sales
    };
  },

  getTextbookSalesByStudentId(studentId: string): TextbookSale[] {
    return this.getTextbookSales().filter((s) => s.studentId === studentId);
  },

  getLowStockTextbooks(): Textbook[] {
    return this.getTextbooks().filter((t) => t.stock <= t.minStock);
  },

  getAllStudentsBillingSummary(yearMonth?: string): StudentMonthlyBillingSummary[] {
    const students = this.getStudents().filter((s) => s.status === 'active');
    return students.map((s) => this.getStudentBillingSummary(s.id, yearMonth));
  },

  recordCombinedPayment(req: CombinedPaymentRequest): {
    tuitionInvoice?: TuitionInvoice;
    textbookPayments: TextbookPayment[];
    totalPaidAmount: number;
  } {
    let tuitionInvoice: TuitionInvoice | undefined;
    const textbookPayments: TextbookPayment[] = [];
    let totalPaid = 0;

    // 1. Process Tuition if amount > 0
    if (req.tuitionAmount > 0) {
      const invoices = this.getInvoices().filter(
        (i) => i.studentId === req.studentId && i.yearMonth === req.yearMonth
      );
      if (invoices.length > 0) {
        const inv = invoices[0];
        const res = this.recordPayment(inv.id, req.tuitionAmount, req.paymentMethod, req.memo);
        if (res) {
          tuitionInvoice = res;
          totalPaid += req.tuitionAmount;
        }
      }
    }

    // 2. Process Textbook Sales payments
    if (req.textbookPayments && req.textbookPayments.length > 0) {
      req.textbookPayments.forEach((item) => {
        if (item.amount > 0) {
          const res = this.recordTextbookPayment(
            item.saleId,
            item.amount,
            req.paymentMethod,
            req.paymentDate,
            req.memo
          );
          if (res) {
            textbookPayments.push(res.payment);
            totalPaid += item.amount;
          }
        }
      });
    }

    return { tuitionInvoice, textbookPayments, totalPaidAmount: totalPaid };
  },

  getUnpaidTextbookSales(): (TextbookSale & { daysOverdue: number })[] {
    const sales = this.getTextbookSales();
    const today = new Date();

    return sales
      .filter((s) => s.status === 'unpaid' || s.status === 'partial')
      .map((s) => {
        const saleD = new Date(s.saleDate);
        const diffTime = Math.max(0, today.getTime() - saleD.getTime());
        const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return {
          ...s,
          daysOverdue
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  },

  getUnpaidInvoices(): UnpaidInvoiceItem[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.getInvoices()
      .filter((inv) => inv.unpaidAmount > 0)
      .map((inv) => {
        const due = inv.dueDate;
        const diffMs = new Date(today).getTime() - new Date(due).getTime();
        const daysOverdue = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
        return { ...inv, daysOverdue };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  },

  getUnifiedUnpaidSummaries(): StudentUnpaidSummary[] {
    const students = this.getStudents().filter((s) => s.status === 'active' || s.status === 'leave');
    const unpaidInvoices = this.getUnpaidInvoices();
    const unpaidSales = this.getUnpaidTextbookSales();

    const map = new Map<string, StudentUnpaidSummary>();

    for (const st of students) {
      map.set(st.id, {
        studentId: st.id,
        studentName: st.name,
        parentName: st.parentName,
        parentPhone: st.parentPhone,
        tuitionUnpaid: 0,
        textbookUnpaid: 0,
        totalUnpaid: 0,
        overdueCount: 0,
        oldestOverdueDays: 0,
        tuitionItems: [],
        textbookItems: [],
      });
    }

    for (const inv of unpaidInvoices) {
      let entry = map.get(inv.studentId);
      if (!entry) {
        entry = {
          studentId: inv.studentId,
          studentName: inv.studentName,
          parentName: '',
          parentPhone: '',
          tuitionUnpaid: 0,
          textbookUnpaid: 0,
          totalUnpaid: 0,
          overdueCount: 0,
          oldestOverdueDays: 0,
          tuitionItems: [],
          textbookItems: [],
        };
        map.set(inv.studentId, entry);
      }
      entry.tuitionItems.push(inv);
      entry.tuitionUnpaid += inv.unpaidAmount;
      if (inv.daysOverdue > 0) entry.overdueCount += 1;
      entry.oldestOverdueDays = Math.max(entry.oldestOverdueDays, inv.daysOverdue);
    }

    for (const sale of unpaidSales) {
      let entry = map.get(sale.studentId);
      if (!entry) {
        entry = {
          studentId: sale.studentId,
          studentName: sale.studentName,
          parentName: sale.parentName,
          parentPhone: sale.parentPhone,
          tuitionUnpaid: 0,
          textbookUnpaid: 0,
          totalUnpaid: 0,
          overdueCount: 0,
          oldestOverdueDays: 0,
          tuitionItems: [],
          textbookItems: [],
        };
        map.set(sale.studentId, entry);
      }
      entry.textbookItems.push(sale);
      entry.textbookUnpaid += sale.unpaidAmount;
      if (sale.daysOverdue > 30) entry.overdueCount += 1;
      entry.oldestOverdueDays = Math.max(entry.oldestOverdueDays, sale.daysOverdue);
    }

    return Array.from(map.values())
      .map((e) => ({ ...e, totalUnpaid: e.tuitionUnpaid + e.textbookUnpaid }))
      .filter((e) => e.totalUnpaid > 0)
      .sort((a, b) => b.totalUnpaid - a.totalUnpaid);
  },

  getUnifiedUnpaidStats() {
    const summaries = this.getUnifiedUnpaidSummaries();
    const tuitionTotal = summaries.reduce((s, e) => s + e.tuitionUnpaid, 0);
    const textbookTotal = summaries.reduce((s, e) => s + e.textbookUnpaid, 0);
    const overdueStudents = summaries.filter((e) => e.overdueCount > 0).length;
    return {
      studentCount: summaries.length,
      tuitionTotal,
      textbookTotal,
      grandTotal: tuitionTotal + textbookTotal,
      overdueStudents,
      overdueInvoices: this.getUnpaidInvoices().filter((i) => i.daysOverdue > 0).length,
    };
  },

  getMakeupItems(): MakeupItem[] {
    const students = this.getStudents();
    const studentMap = new Map(students.map((s) => [s.id, s]));

    return this.getAttendance()
      .filter((r) => r.status === 'absent' || r.status === 'make_up')
      .map((r) => {
        const st = studentMap.get(r.studentId);
        let status: MakeupItem['status'] = 'pending';
        if (r.status === 'make_up') {
          status = 'completed';
        } else if (r.makeUpDate) {
          status = 'scheduled';
        }

        return {
          attendanceId: r.id,
          studentId: r.studentId,
          studentName: r.studentName,
          parentPhone: st?.parentPhone || '',
          classId: r.classId,
          className: r.className,
          originalDate: r.date,
          absentReason: r.absentReason,
          makeUpDate: r.makeUpDate,
          status,
          memo: r.memo,
        };
      })
      .sort((a, b) => {
        const order = { pending: 0, scheduled: 1, completed: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return b.originalDate.localeCompare(a.originalDate);
      });
  },

  scheduleMakeup(attendanceId: string, makeUpDate: string): AttendanceRecord | null {
    const list = this.getAttendance();
    const idx = list.findIndex((r) => r.id === attendanceId);
    if (idx === -1) return null;
    const updated: AttendanceRecord = {
      ...list[idx],
      makeUpDate,
      makeUpRequired: true,
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.ATTENDANCE, list);
    return updated;
  },

  completeMakeup(attendanceId: string, memo?: string): AttendanceRecord | null {
    const list = this.getAttendance();
    const idx = list.findIndex((r) => r.id === attendanceId);
    if (idx === -1) return null;
    const updated: AttendanceRecord = {
      ...list[idx],
      status: 'make_up',
      makeUpRequired: false,
      memo: memo || list[idx].memo,
    };
    list[idx] = updated;
    setItem(STORAGE_KEYS.ATTENDANCE, list);
    return updated;
  },

  getTextbookStats(yearMonth?: string): {
    monthlySaleAmount: number;
    monthlyPaidAmount: number;
    totalSalesAmount: number; // alias
    totalPaidAmount: number; // alias
    totalUnpaidAmount: number;
    unpaidStudentsCount: number;
    monthlyBooksSold: number;
    lowStockBooksCount: number;
  } {
    const ym = yearMonth || new Date().toISOString().slice(0, 7);
    const allSales = this.getTextbookSales();
    const allPayments = this.getTextbookPayments();
    const allTextbooks = this.getTextbooks();

    // 1. This month sales
    const monthlySales = allSales.filter((s) => s.saleDate.startsWith(ym));
    const monthlySaleAmount = monthlySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthlyBooksSold = monthlySales.reduce((sum, s) => sum + s.quantity, 0);

    // 2. This month payments
    const monthlyPayments = allPayments.filter((p) => p.paymentDate.startsWith(ym));
    const monthlyPaidAmount = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

    // 3. Total unpaid across all sales
    const unpaidSales = allSales.filter((s) => s.status === 'unpaid' || s.status === 'partial');
    const totalUnpaidAmount = unpaidSales.reduce((sum, s) => sum + s.unpaidAmount, 0);

    // 4. Unique unpaid students count
    const unpaidStudentIds = new Set(unpaidSales.map((s) => s.studentId));
    const unpaidStudentsCount = unpaidStudentIds.size;

    // 5. Low stock books count (stock <= minStock)
    const lowStockBooksCount = allTextbooks.filter((t) => t.stock <= t.minStock).length;

    return {
      monthlySaleAmount,
      monthlyPaidAmount,
      totalSalesAmount: monthlySaleAmount,
      totalPaidAmount: monthlyPaidAmount,
      totalUnpaidAmount,
      unpaidStudentsCount,
      monthlyBooksSold,
      lowStockBooksCount
    };
  },

  getRevenueBreakdown(yearMonth?: string): {
    tuitionRevenue: number;
    textbookRevenue: number;
    otherRevenue: number;
    totalRevenue: number;
  } {
    const ym = yearMonth || new Date().toISOString().slice(0, 7);
    
    // Tuition Paid in Month
    const invoices = this.getInvoices().filter((inv) => inv.paidAt && inv.paidAt.startsWith(ym));
    const tuitionRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    // Textbook Paid in Month
    const textbookPayments = this.getTextbookPayments().filter((p) => p.paymentDate.startsWith(ym));
    const textbookRevenue = textbookPayments.reduce((sum, p) => sum + p.amount, 0);

    // Other Revenue (e.g. registration fees from tuition extraFee or consultation)
    const otherInvoices = invoices.reduce((sum, inv) => sum + (inv.extraFee || 0), 0);
    const otherRevenue = otherInvoices;

    const totalRevenue = tuitionRevenue + textbookRevenue + otherRevenue;

    return {
      tuitionRevenue,
      textbookRevenue,
      otherRevenue,
      totalRevenue
    };
  },

  // Songs
  getSongs(): Song[] {
    return getItem<Song[]>(STORAGE_KEYS.SONGS, []);
  },

  saveSong(song: Omit<Song, 'id'> & { id?: string }): Song {
    const list = this.getSongs();
    let saved: Song;
    if (song.id) {
      const idx = list.findIndex((s) => s.id === song.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...song, id: song.id };
        list[idx] = saved;
      } else {
        saved = { ...song, id: song.id };
        list.push(saved);
      }
    } else {
      saved = {
        ...song,
        id: generateEntityId('song')
      };
      list.push(saved);
    }
    setItem(STORAGE_KEYS.SONGS, list);
    return saved;
  },

  deleteSong(id: string): boolean {
    const list = this.getSongs();
    const filtered = list.filter((s) => s.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.SONGS, filtered);
      return true;
    }
    return false;
  },

  // Events
  getEvents(): AcademyEvent[] {
    return getItem<AcademyEvent[]>(STORAGE_KEYS.EVENTS, []);
  },

  saveEvent(event: Omit<AcademyEvent, 'id'> & { id?: string }): AcademyEvent {
    const list = this.getEvents();
    let saved: AcademyEvent;
    if (event.id) {
      const idx = list.findIndex((e) => e.id === event.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...event, id: event.id };
        list[idx] = saved;
      } else {
        saved = { ...event, id: event.id };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...event,
        id: generateEntityId('ev'),
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.EVENTS, list);
    return saved;
  },

  deleteEvent(id: string): boolean {
    const list = this.getEvents();
    const filtered = list.filter((e) => e.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.EVENTS, filtered);
      return true;
    }
    return false;
  },

  getRecitalEvents(): AcademyEvent[] {
    return this.getEvents()
      .filter((e) => e.type === 'concert' || e.type === 'competition')
      .sort((a, b) => b.startDate.localeCompare(a.startDate));
  },

  eventTypeToVideoType(type: AcademyEvent['type']): PerformanceVideo['eventType'] {
    return academyEventTypeToVideoType(type);
  },

  getPerformanceVideosByEventId(eventId: string): PerformanceVideo[] {
    return this.getPerformanceVideos().filter((v) => v.eventId === eventId);
  },

  getEventParticipantSummaries(eventId: string): EventParticipantSummary[] {
    const event = this.getEvents().find((e) => e.id === eventId);
    if (!event) return [];

    const students = this.getStudents();
    const videos = this.getPerformanceVideosByEventId(eventId);

    return (event.participantIds || []).map((studentId) => {
      const st = students.find((s) => s.id === studentId);
      const video = videos.find((v) => v.studentId === studentId);
      return {
        studentId,
        studentName: st?.name || '알 수 없음',
        parentPhone: st?.parentPhone || '',
        level: st?.level,
        hasVideo: Boolean(video),
        videoId: video?.id,
        videoTitle: video?.title,
      };
    });
  },

  setEventParticipants(eventId: string, participantIds: string[]): AcademyEvent | null {
    const event = this.getEvents().find((e) => e.id === eventId);
    if (!event) return null;
    return this.saveEvent({ ...event, participantIds });
  },

  addEventParticipant(eventId: string, studentId: string): AcademyEvent | null {
    const event = this.getEvents().find((e) => e.id === eventId);
    if (!event) return null;
    const ids = event.participantIds || [];
    if (ids.includes(studentId)) return event;
    return this.saveEvent({ ...event, participantIds: [...ids, studentId] });
  },

  removeEventParticipant(eventId: string, studentId: string): AcademyEvent | null {
    const event = this.getEvents().find((e) => e.id === eventId);
    if (!event) return null;
    const ids = (event.participantIds || []).filter((id) => id !== studentId);
    return this.saveEvent({ ...event, participantIds: ids });
  },

  // Performance Videos
  getPerformanceVideos(): PerformanceVideo[] {
    return getItem<PerformanceVideo[]>(STORAGE_KEYS.PERFORMANCE_VIDEOS, []);
  },

  getPerformanceVideosByStudentId(studentId: string): PerformanceVideo[] {
    return this.getPerformanceVideos().filter((v) => v.studentId === studentId);
  },

  savePerformanceVideo(
    video: Omit<PerformanceVideo, 'id'> & { id?: string }
  ): PerformanceVideo {
    const list = this.getPerformanceVideos();
    let saved: PerformanceVideo;
    if (video.id) {
      const idx = list.findIndex((v) => v.id === video.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...video, id: video.id };
        list[idx] = saved;
      } else {
        saved = { ...video, id: video.id };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...video,
        id: generateEntityId('pv'),
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.PERFORMANCE_VIDEOS, list);
    return saved;
  },

  deletePerformanceVideo(id: string): boolean {
    const list = this.getPerformanceVideos();
    const filtered = list.filter((v) => v.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.PERFORMANCE_VIDEOS, filtered);
      return true;
    }
    return false;
  },

  // Notifications
  getNotifications(): AppNotification[] {
    return getItem<AppNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  },

  saveNotification(notif: Omit<AppNotification, 'id' | 'createdAt'> & { id?: string }): AppNotification {
    const list = this.getNotifications();
    const now = new Date().toISOString();
    let saved: AppNotification;
    if (notif.id) {
      const idx = list.findIndex((n) => n.id === notif.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...notif, id: notif.id };
        list[idx] = saved;
      } else {
        saved = { ...notif, id: notif.id, createdAt: now };
        list.unshift(saved);
      }
    } else {
      saved = {
        ...notif,
        id: generateEntityId('notif'),
        createdAt: now
      };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    return saved;
  },

  sendNotification(id: string): boolean {
    const list = this.getNotifications();
    const idx = list.findIndex((n) => n.id === id);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        status: 'sent',
        sentAt: new Date().toISOString()
      };
      setItem(STORAGE_KEYS.NOTIFICATIONS, list);
      return true;
    }
    return false;
  },

  deleteNotification(id: string): boolean {
    const list = this.getNotifications();
    const filtered = list.filter((n) => n.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.NOTIFICATIONS, filtered);
      return true;
    }
    return false;
  },

  // Dashboard Aggregates & Analytics
  getDashboardStats() {
    const students = this.getStudents();
    const classes = this.getClasses();
    const attendance = this.getAttendance();
    const invoices = this.getInvoices();
    const expenses = this.getExpenses();

    const currentYearMonth = new Date().toISOString().slice(0, 7);
    const todayStr = new Date().toISOString().slice(0, 10);
    const dayOfWeekIndex = new Date().getDay(); // 0 = Sun, 1 = Mon, ...
    const dayMap = ['일', '월', '화', '수', '목', '금', '토'] as const;
    const todayKoreanDay = dayMap[dayOfWeekIndex];

    const totalStudents = students.length;
    const activeStudents = students.filter((s) => s.status === 'active').length;
    const leaveStudents = students.filter((s) => s.status === 'leave').length;
    const withdrawnStudents = students.filter((s) => s.status === 'withdrawn').length;

    // New students registered in the current month
    const newStudentsThisMonth = students.filter((s) => s.joinDate.startsWith(currentYearMonth)).length;

    // Financials for current month
    const currentMonthInvoices = invoices.filter((i) => i.yearMonth === currentYearMonth);
    const totalBilledThisMonth = currentMonthInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const totalPaidThisMonth = currentMonthInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
    const totalUnpaidThisMonth = currentMonthInvoices.reduce((sum, i) => sum + i.unpaidAmount, 0);
    const unpaidStudentsCount = currentMonthInvoices.filter((i) => i.status === 'unpaid' || i.status === 'partial').length;
    const collectionRate = totalBilledThisMonth > 0 ? Math.round((totalPaidThisMonth / totalBilledThisMonth) * 100) : 100;

    // Expenses for current month
    const currentMonthExpenses = expenses.filter((e) => e.date.startsWith(currentYearMonth));
    const totalExpensesThisMonth = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfitThisMonth = totalPaidThisMonth - totalExpensesThisMonth;

    // Today's classes & attendance
    const todayClasses = classes.filter((c) => c.daysOfWeek.includes(todayKoreanDay as any));
    const todayAttendance = attendance.filter((a) => a.date === todayStr);
    const todayPresent = todayAttendance.filter((a) => a.status === 'present' || a.status === 'make_up').length;
    const todayAbsent = todayAttendance.filter((a) => a.status === 'absent').length;
    const todayLate = todayAttendance.filter((a) => a.status === 'late' || a.status === 'early_leave').length;

    // 6-Month Revenue & Student Growth Trends
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toISOString().slice(0, 7));
    }

    const revenueTrend = months.map((ym) => {
      const invs = invoices.filter((i) => i.yearMonth === ym);
      const paid = invs.reduce((sum, i) => sum + i.paidAmount, 0);
      const billed = invs.reduce((sum, i) => sum + i.totalAmount, 0);
      const exps = expenses.filter((e) => e.date.startsWith(ym)).reduce((sum, e) => sum + e.amount, 0);
      const label = ym.slice(5) + '월';
      return {
        yearMonth: ym,
        month: label,
        매출: paid,
        지출: exps,
        청구액: billed,
      };
    });

    const studentTrend = months.map((ym) => {
      const label = ym.slice(5) + '월';
      const [year, month] = ym.split('-').map(Number);
      const monthEnd = `${ym}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`;
      const activeAtMonth = students.filter((s) => {
        if (s.joinDate > monthEnd) return false;
        if (s.status === 'withdrawn' && s.leaveDate && s.leaveDate <= monthEnd) return false;
        return true;
      }).length;
      const newCount = students.filter((s) => s.joinDate.startsWith(ym)).length;
      return {
        month: label,
        원생수: activeAtMonth,
        신규: newCount,
      };
    });

    // Unpaid breakdown
    const unpaidBreakdown = [
      { name: '수납 완료', value: totalPaidThisMonth, color: '#10b981' },
      { name: '미납액', value: totalUnpaidThisMonth, color: '#ef4444' }
    ];

    // Class student distribution
    const classDistribution = classes.map((c) => {
      const enrolled = students.filter((s) => s.status === 'active' && s.classIds.includes(c.id)).length;
      return {
        name: c.name.length > 10 ? c.name.slice(0, 9) + '…' : c.name,
        fullName: c.name,
        studentsCount: enrolled,
        capacity: c.capacity,
        color: c.color || '#3b82f6'
      };
    });

    return {
      totalStudents,
      activeStudents,
      leaveStudents,
      withdrawnStudents,
      newStudentsThisMonth,
      totalPaidThisMonth,
      totalUnpaidThisMonth,
      totalBilledThisMonth,
      unpaidStudentsCount,
      collectionRate,
      todayClassesCount: todayClasses.length,
      todayPresent,
      todayAbsent,
      todayLate,
      totalExpensesThisMonth,
      netProfitThisMonth,
      revenueTrend,
      studentTrend,
      unpaidBreakdown,
      classDistribution,
      todayClasses,
      currentYearMonth
    };
  },

  // Batch generate invoices for all active students for a given yearMonth
  batchGenerateMonthlyInvoices(yearMonth: string): number {
    const students = this.getStudents().filter((s) => s.status === 'active');
    const existingInvoices = this.getInvoices();
    let generatedCount = 0;

    students.forEach((s) => {
      const alreadyHas = existingInvoices.some((i) => i.studentId === s.id && i.yearMonth === yearMonth);
      if (!alreadyHas) {
        const fee = s.tuitionFee || 180000;
        const dueDay = String(s.paymentDay || 10).padStart(2, '0');
        const dueDate = `${yearMonth}-${dueDay}`;

        this.saveInvoice({
          studentId: s.id,
          studentName: s.name,
          yearMonth,
          baseTuition: fee,
          discountAmount: 0,
          additionalAmount: 0,
          totalAmount: fee,
          paidAmount: 0,
          unpaidAmount: fee,
          dueDate,
          status: 'unpaid'
        });
        generatedCount++;
      }
    });

    return generatedCount;
  },

  // Save academy settings
  saveSettings(settings: AcademySettings): AcademySettings {
    setItem(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  },

  // Aliases for export/import/reset
  exportAllData(): string {
    return this.exportDatabaseJSON();
  },

  importAllData(jsonStr: string): boolean {
    return this.importDatabaseJSON(jsonStr);
  },

  // Onboarding
  isOnboardingComplete(): boolean {
    return getItem<boolean>(STORAGE_KEYS.INITIALIZED, false);
  },

  setOnboardingComplete(complete = true): void {
    setItem(STORAGE_KEYS.INITIALIZED, complete);
  },

  isNewOrganization(): boolean {
    const industry = getIndustryType();
    if (industry === 'pilates') {
      return (
        this.getStudents().length === 0 &&
        this.getServiceOfferings().length === 0 &&
        !this.getSettings().name?.trim()
      );
    }
    return (
      this.getStudents().length === 0 &&
      this.getClasses().length === 0 &&
      !this.getSettings().name?.trim()
    );
  },

  shouldShowOnboarding(): boolean {
    return !this.isOnboardingComplete() && this.isNewOrganization();
  },

  // Bookings (core.schedules — 필라테스 등 예약형 업종)
  getBookings(): Booking[] {
    return getItem<Booking[]>(STORAGE_KEYS.SCHEDULES, []);
  },

  saveBooking(booking: Omit<Booking, 'id'> & { id?: string }): Booking {
    const list = this.getBookings();
    let saved: Booking;
    if (booking.id) {
      const idx = list.findIndex((b) => b.id === booking.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...booking, id: booking.id };
        list[idx] = saved;
      } else {
        saved = { ...booking, id: booking.id };
        list.unshift(saved);
      }
    } else {
      saved = { ...booking, id: generateEntityId('bk') };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.SCHEDULES, list);
    return saved;
  },

  updateBookingStatus(id: string, status: BookingStatus): Booking | null {
    const list = this.getBookings();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    const updated = { ...list[idx], status };
    list[idx] = updated;
    setItem(STORAGE_KEYS.SCHEDULES, list);
    return updated;
  },

  deleteBooking(id: string): boolean {
    const list = this.getBookings();
    const filtered = list.filter((b) => b.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.SCHEDULES, filtered);
      return true;
    }
    return false;
  },

  // Service offerings (core.services — 필라테스 수업 종류)
  getServiceOfferings(): ServiceOffering[] {
    return getItem<ServiceOffering[]>(STORAGE_KEYS.SERVICE_OFFERINGS, []);
  },

  saveServiceOffering(offering: Omit<ServiceOffering, 'id'> & { id?: string }): ServiceOffering {
    const list = this.getServiceOfferings();
    let saved: ServiceOffering;
    if (offering.id) {
      const idx = list.findIndex((o) => o.id === offering.id);
      if (idx >= 0) {
        saved = { ...list[idx], ...offering, id: offering.id };
        list[idx] = saved;
      } else {
        saved = { ...offering, id: offering.id };
        list.unshift(saved);
      }
    } else {
      saved = { ...offering, id: generateEntityId('svc') };
      list.unshift(saved);
    }
    setItem(STORAGE_KEYS.SERVICE_OFFERINGS, list);
    return saved;
  },

  deleteServiceOffering(id: string): boolean {
    const list = this.getServiceOfferings();
    const filtered = list.filter((o) => o.id !== id);
    if (filtered.length !== list.length) {
      setItem(STORAGE_KEYS.SERVICE_OFFERINGS, filtered);
      return true;
    }
    return false;
  },

  // ─── Parent ↔ Student links (Source of Truth) ───────────────
  getParentStudentLinks(): ParentStudentLink[] {
    const links = getItem<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS, []);
    if (links.length === 0) {
      this.migrateLegacyParentLinks();
      return getItem<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS, []);
    }
    return links;
  },

  saveParentStudentLinks(links: ParentStudentLink[]): void {
    setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, links);
    this.rebuildParentStudentIdsFromLinks();
  },

  linkParentToStudent(params: {
    parentId: string;
    studentId: string;
    relationship: GuardianRelationship;
    isPrimary?: boolean;
  }): ParentStudentLink {
    const list = this.getParentStudentLinks();
    const now = new Date().toISOString();
    const existingIdx = list.findIndex(
      (l) => l.parentId === params.parentId && l.studentId === params.studentId
    );

    if (params.isPrimary) {
      for (const link of list) {
        if (link.studentId === params.studentId) link.isPrimary = false;
      }
    }

    let saved: ParentStudentLink;
    if (existingIdx >= 0) {
      saved = {
        ...list[existingIdx],
        relationship: params.relationship,
        isPrimary: params.isPrimary ?? list[existingIdx].isPrimary,
        updatedAt: now,
      };
      list[existingIdx] = saved;
    } else {
      saved = {
        id: `${params.parentId}:${params.studentId}`,
        parentId: params.parentId,
        studentId: params.studentId,
        relationship: params.relationship,
        isPrimary: params.isPrimary ?? list.filter((l) => l.studentId === params.studentId).length === 0,
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
    }

    this.saveParentStudentLinks(list);
    return saved;
  },

  unlinkParentFromStudent(parentId: string, studentId: string): void {
    const list = this.getParentStudentLinks().filter(
      (l) => !(l.parentId === parentId && l.studentId === studentId)
    );
    this.saveParentStudentLinks(list);
  },

  rebuildParentStudentIdsFromLinks(): void {
    const links = getItem<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS, []);
    const parents = this.getParents();
    const byParent = new Map<string, string[]>();
    for (const link of links) {
      const arr = byParent.get(link.parentId) || [];
      if (!arr.includes(link.studentId)) arr.push(link.studentId);
      byParent.set(link.parentId, arr);
    }
    let changed = false;
    const updated = parents.map((p) => {
      const ids = byParent.get(p.id) || [];
      const same =
        ids.length === p.studentIds.length && ids.every((id) => p.studentIds.includes(id));
      if (!same) {
        changed = true;
        return { ...p, studentIds: ids };
      }
      return p;
    });
    if (changed) setItem(STORAGE_KEYS.PARENTS, updated);
  },

  migrateLegacyParentLinks(): void {
    const existing = getItem<ParentStudentLink[]>(STORAGE_KEYS.PARENT_STUDENT_LINKS, []);
    if (existing.length > 0) return;

    const students = getItem<Student[]>(STORAGE_KEYS.STUDENTS, []);
    const parents = getItem<Parent[]>(STORAGE_KEYS.PARENTS, []);
    const links: ParentStudentLink[] = [];
    const now = new Date().toISOString();

    for (const student of students) {
      let parent: Parent | undefined;
      if (student.parentId) {
        parent = parents.find((p) => p.id === student.parentId);
      }
      if (!parent && student.parentPhone) {
        parent = parents.find((p) => p.phone === student.parentPhone);
      }
      if (!parent && (student.parentName || student.parentPhone)) {
        parent = this.saveParent({
          name: student.parentName || '학부모',
          phone: student.parentPhone || '',
          studentIds: [],
        });
        if (!parents.find((p) => p.id === parent!.id)) {
          parents.push(parent);
        }
      }
      if (!parent) continue;

      links.push({
        id: `${parent.id}:${student.id}`,
        parentId: parent.id,
        studentId: student.id,
        relationship: 'other',
        isPrimary: true,
        createdAt: now,
      });
    }

    if (links.length > 0) {
      setItem(STORAGE_KEYS.PARENT_STUDENT_LINKS, links);
      this.rebuildParentStudentIdsFromLinks();
    }
  },

  createOrLinkParent(params: {
    studentId: string;
    existingParentId?: string;
    name?: string;
    phone?: string;
    email?: string;
    relationship: GuardianRelationship;
    isPrimary?: boolean;
  }): Parent {
    let parent: Parent | undefined;

    if (params.existingParentId) {
      parent = this.getParents().find((p) => p.id === params.existingParentId);
      if (!parent) throw new Error('선택한 학부모를 찾을 수 없습니다.');
    } else {
      if (!params.name?.trim() || !params.phone?.trim()) {
        throw new Error('학부모 이름과 전화번호를 입력해 주세요.');
      }
      parent = this.getParents().find((p) => p.phone === params.phone!.trim());
      if (!parent) {
        parent = this.saveParent({
          name: params.name.trim(),
          phone: params.phone.trim(),
          email: params.email?.trim() || undefined,
          studentIds: [],
        });
      } else {
        const updates: Partial<Parent> = {};
        if (params.email?.trim() && params.email !== parent.email) updates.email = params.email.trim();
        if (params.name?.trim() && params.name !== parent.name) updates.name = params.name.trim();
        if (Object.keys(updates).length > 0) {
          parent = this.saveParent({ ...parent, ...updates });
        }
      }
    }

    this.linkParentToStudent({
      parentId: parent.id,
      studentId: params.studentId,
      relationship: params.relationship,
      isPrimary: params.isPrimary,
    });

    return this.getParents().find((p) => p.id === parent!.id) || parent;
  },

  /** 학생 보호자 links 전체 동기화 (추가·수정·제거) */
  syncStudentGuardians(
    studentId: string,
    entries: Array<{
      existingParentId?: string;
      name?: string;
      phone?: string;
      email?: string;
      relationship: GuardianRelationship;
      isPrimary?: boolean;
    }>
  ): Parent[] {
    const parents: Parent[] = [];
    const targetParentIds = new Set<string>();

    for (const entry of entries) {
      const parent = this.createOrLinkParent({
        studentId,
        existingParentId: entry.existingParentId,
        name: entry.name,
        phone: entry.phone,
        email: entry.email,
        relationship: entry.relationship,
        isPrimary: entry.isPrimary,
      });
      parents.push(parent);
      targetParentIds.add(parent.id);
    }

    const currentLinks = this.getParentStudentLinks().filter((l) => l.studentId === studentId);
    for (const link of currentLinks) {
      if (!targetParentIds.has(link.parentId)) {
        this.unlinkParentFromStudent(link.parentId, studentId);
      }
    }

    const remaining = this.getParentStudentLinks().filter((l) => l.studentId === studentId);
    if (remaining.length > 0 && !remaining.some((l) => l.isPrimary)) {
      const first = remaining[0];
      this.linkParentToStudent({
        parentId: first.parentId,
        studentId,
        relationship: first.relationship,
        isPrimary: true,
      });
    }

    this.rebuildParentStudentIdsFromLinks();
    return parents;
  },

  // ─── Parent helpers ─────────────────────────────────────────
  getStudentsForParent(parentCustomerId: string): Student[] {
    const studentIds = new Set(
      this.getParentStudentLinks()
        .filter((l) => l.parentId === parentCustomerId)
        .map((l) => l.studentId)
    );
    if (studentIds.size === 0) {
      const parent = this.getParents().find((p) => p.id === parentCustomerId);
      if (parent) parent.studentIds.forEach((id) => studentIds.add(id));
    }
    return this.getStudents().filter((s) => studentIds.has(s.id));
  },

  /** @deprecated linkParentToStudent / createOrLinkParent 사용 */
  ensureParentFromStudent(
    student: Student,
    options?: { parentEmail?: string; relationship?: GuardianRelationship }
  ): Parent {
    return this.createOrLinkParent({
      studentId: student.id,
      existingParentId: student.parentId,
      name: student.parentName,
      phone: student.parentPhone,
      email: options?.parentEmail,
      relationship: options?.relationship || 'other',
      isPrimary: true,
    });
  },

  syncParentsFromStudents(): Parent[] {
    this.migrateLegacyParentLinks();
    this.rebuildParentStudentIdsFromLinks();
    return this.getParents();
  },

  // ─── Curriculum ─────────────────────────────────────────────
  getCurriculumLevels(): CurriculumLevel[] {
    return getItem<CurriculumLevel[]>(STORAGE_KEYS.CURRICULUM_LEVELS, []);
  },

  saveCurriculumLevel(level: Omit<CurriculumLevel, 'id'> & { id?: string }): CurriculumLevel {
    const list = this.getCurriculumLevels();
    const saved = level.id
      ? { ...list.find((l) => l.id === level.id)!, ...level, id: level.id }
      : { ...level, id: generateEntityId('clv') };
    const idx = list.findIndex((l) => l.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.push(saved);
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    setItem(STORAGE_KEYS.CURRICULUM_LEVELS, list);
    return saved;
  },

  getCurriculumItems(levelId?: string): CurriculumItem[] {
    const items = getItem<CurriculumItem[]>(STORAGE_KEYS.CURRICULUM_ITEMS, []);
    return levelId ? items.filter((i) => i.levelId === levelId) : items;
  },

  saveCurriculumItem(item: Omit<CurriculumItem, 'id'> & { id?: string }): CurriculumItem {
    const list = this.getCurriculumItems();
    const saved = item.id
      ? { ...list.find((i) => i.id === item.id)!, ...item, id: item.id }
      : { ...item, id: generateEntityId('cit') };
    const idx = list.findIndex((i) => i.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.push(saved);
    setItem(STORAGE_KEYS.CURRICULUM_ITEMS, list);
    return saved;
  },

  getCurriculumProgress(studentId?: string): StudentCurriculumProgress[] {
    const list = getItem<StudentCurriculumProgress[]>(STORAGE_KEYS.CURRICULUM_PROGRESS, []);
    return studentId ? list.filter((p) => p.studentId === studentId) : list;
  },

  saveCurriculumProgress(
    prog: Omit<StudentCurriculumProgress, 'id'> & { id?: string }
  ): StudentCurriculumProgress {
    const list = this.getCurriculumProgress();
    const saved = prog.id
      ? { ...list.find((p) => p.id === prog.id)!, ...prog, id: prog.id }
      : { ...prog, id: generateEntityId('cpr') };
    const idx = list.findIndex(
      (p) => p.studentId === saved.studentId && p.curriculumItemId === saved.curriculumItemId
    );
    if (idx >= 0) list[idx] = saved;
    else list.push(saved);
    setItem(STORAGE_KEYS.CURRICULUM_PROGRESS, list);
    return saved;
  },

  seedDefaultCurriculum(): void {
    if (this.getCurriculumLevels().length > 0) return;
    const levels: { name: string; songs: string[] }[] = [
      { name: '바이엘 상', songs: ['바이엘 1-10', '바이엘 11-20', '바이엘 21-30'] },
      { name: '체르니 100', songs: ['체르니 100 No.1', '체르니 100 No.5', '체르니 100 No.10'] },
      { name: '체르니 30', songs: ['체르니 30 No.1', '체르니 30 No.6', '체르니 30 No.11'] },
    ];
    levels.forEach((lv, li) => {
      const level = this.saveCurriculumLevel({ name: lv.name, sortOrder: li, description: `${lv.name} 표준 곡목` });
      lv.songs.forEach((title, si) => {
        this.saveCurriculumItem({ levelId: level.id, title, sortOrder: si, required: true });
      });
    });
  },

  // ─── Weekly assignments ───────────────────────────────────
  getWeeklyAssignments(studentId?: string): WeeklyAssignment[] {
    const list = getItem<WeeklyAssignment[]>(STORAGE_KEYS.WEEKLY_ASSIGNMENTS, []);
    return studentId ? list.filter((a) => a.studentId === studentId) : list;
  },

  getCurrentWeekStart(): string {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().slice(0, 10);
  },

  saveWeeklyAssignment(
    assignment: Omit<WeeklyAssignment, 'id' | 'items'> & { id?: string; items?: WeeklyAssignment['items'] }
  ): WeeklyAssignment {
    const list = this.getWeeklyAssignments();
    const items = assignment.items || [];
    const saved: WeeklyAssignment = assignment.id
      ? { ...list.find((a) => a.id === assignment.id)!, ...assignment, id: assignment.id, items }
      : { ...assignment, id: generateEntityId('wasg'), items, status: assignment.status || 'assigned' };
    const idx = list.findIndex((a) => a.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.unshift(saved);
    setItem(STORAGE_KEYS.WEEKLY_ASSIGNMENTS, list);
    return saved;
  },

  confirmAssignmentItem(assignmentId: string, itemId: string): boolean {
    const list = this.getWeeklyAssignments();
    const aIdx = list.findIndex((a) => a.id === assignmentId);
    if (aIdx < 0) return false;
    const items = list[aIdx].items.map((it) =>
      it.id === itemId
        ? { ...it, parentConfirmed: true, parentConfirmedAt: new Date().toISOString(), completed: true, completedAt: new Date().toISOString() }
        : it
    );
    list[aIdx] = { ...list[aIdx], items, status: 'submitted' };
    setItem(STORAGE_KEYS.WEEKLY_ASSIGNMENTS, list);
    return true;
  },

  // ─── Achievements ─────────────────────────────────────────
  getAchievements(studentId?: string): Achievement[] {
    const list = getItem<Achievement[]>(STORAGE_KEYS.ACHIEVEMENTS, []);
    return studentId ? list.filter((a) => a.studentId === studentId) : list;
  },

  saveAchievement(ach: Omit<Achievement, 'id'> & { id?: string }): Achievement {
    const list = this.getAchievements();
    const saved = ach.id
      ? { ...list.find((a) => a.id === ach.id)!, ...ach, id: ach.id }
      : { ...ach, id: generateEntityId('ach') };
    const idx = list.findIndex((a) => a.id === saved.id);
    if (idx >= 0) list[idx] = saved;
    else list.unshift(saved);
    setItem(STORAGE_KEYS.ACHIEVEMENTS, list);
    return saved;
  },

  deleteAchievement(id: string): boolean {
    const filtered = this.getAchievements().filter((a) => a.id !== id);
    if (filtered.length === this.getAchievements().length) return false;
    setItem(STORAGE_KEYS.ACHIEVEMENTS, filtered);
    return true;
  },

  // ─── Learning reports ─────────────────────────────────────
  getLearningReports(studentId?: string, publishedOnly = false): LearningReport[] {
    let list = getItem<LearningReport[]>(STORAGE_KEYS.LEARNING_REPORTS, []);
    if (studentId) list = list.filter((r) => r.studentId === studentId);
    if (publishedOnly) list = list.filter((r) => r.status === 'published');
    return list.sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
  },

  generateLearningReport(studentId: string, yearMonth: string, staffId?: string): LearningReport {
    const student = this.getStudents().find((s) => s.id === studentId);
    const attendance = this.getAttendance().filter(
      (a) => a.studentId === studentId && a.date.startsWith(yearMonth)
    );
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'make_up').length;
    const attendanceRate = attendance.length > 0 ? Math.round((present / attendance.length) * 100) : 0;
    const practiceMinutes = this.getPracticeRecords()
      .filter((p) => p.studentId === studentId && p.date.startsWith(yearMonth))
      .reduce((s, p) => s + p.minutes, 0);
    const lessonsCount = this.getLessonRecords().filter(
      (l) => l.studentId === studentId && l.date.startsWith(yearMonth)
    ).length;
    const songsCompleted = this.getCurriculumProgress(studentId).filter(
      (p) => p.status === 'completed' && (p.completedAt || '').startsWith(yearMonth)
    ).length;

    return this.saveLearningReport({
      studentId,
      staffId,
      yearMonth,
      status: 'draft',
      summary: `${student?.name || '원생'} ${yearMonth} 학습 리포트`,
      attendanceRate,
      practiceMinutes,
      lessonsCount,
      songsCompleted,
    });
  },

  saveLearningReport(report: Omit<LearningReport, 'id'> & { id?: string }): LearningReport {
    const list = getItem<LearningReport[]>(STORAGE_KEYS.LEARNING_REPORTS, []);
    const saved = report.id
      ? { ...list.find((r) => r.id === report.id)!, ...report, id: report.id }
      : { ...report, id: generateEntityId('lrp') };
    const idx = list.findIndex((r) => r.studentId === saved.studentId && r.yearMonth === saved.yearMonth);
    if (idx >= 0) list[idx] = saved;
    else list.unshift(saved);
    setItem(STORAGE_KEYS.LEARNING_REPORTS, list);
    return saved;
  },

  publishLearningReport(id: string): LearningReport | null {
    const list = this.getLearningReports();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return null;
    list[idx] = { ...list[idx], status: 'published', publishedAt: new Date().toISOString() };
    setItem(STORAGE_KEYS.LEARNING_REPORTS, list);
    return list[idx];
  },
};
