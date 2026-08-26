import {
  Student,
  Parent,
  Teacher,
  ClassItem,
  Consultation,
  PracticeRecord,
  LessonRecord,
  Song,
  AcademyEvent,
  EventParticipantSummary,
  PerformanceVideo,
  AppNotification,
  AcademySettings,
  User,
} from '../types';

import {
  getStorageAdapter,
  STORAGE_KEYS,
} from './adapters';
import { getItem, setItem, generateEntityId, DEFAULT_SETTINGS } from './storage/helpers';
import { createParentEducationStorage } from './storage/parentEducationStorage';
import { createAttendanceStorage } from './storage/attendanceStorage';
import { createFinanceStorage } from './storage/financeStorage';
import { createTextbookStorage } from './storage/textbookStorage';
import { createDaycareCareStorage } from '@/modules/daycare/care/careStorage';
import type { StorageApi } from './storage/helpers';
import { academyEventTypeToVideoType } from '../modules/piano/config/eventLabels';
import type { Booking, BookingStatus, ServiceOffering } from '../core/types/schedule';
import { setIndustryType, getIndustryType } from './adapters/storageContext';
import type { GuardianRelationship, ParentStudentLink } from '../core/parent/types';

type Listener = () => void;

const storageCore = {
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
      careJournals: getItem(STORAGE_KEYS.CARE_JOURNALS, []),
      medicationRequests: getItem(STORAGE_KEYS.MEDICATION_REQUESTS, []),
      exportedAt: new Date().toISOString(),
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
      if (data.careJournals) setItem(STORAGE_KEYS.CARE_JOURNALS, data.careJournals);
      if (data.medicationRequests) {
        setItem(STORAGE_KEYS.MEDICATION_REQUESTS, data.medicationRequests);
      }
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


  // Consultations
  getConsultations(): Consultation[] {
    const list = getItem<Consultation[]>(STORAGE_KEYS.CONSULTATIONS, []);
    const students = this.getStudents() as Student[];
    const studentMap = new Map(students.map((s) => [s.id, s]));
    return list.map((c) => {
      const st = studentMap.get(c.studentId);
      if (!st?.parentName) return c;
      return { ...c, parentName: st.parentName };
    });
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
};

export const StorageService = Object.assign(
  storageCore,
  createParentEducationStorage(storageCore as StorageApi),
  createAttendanceStorage(storageCore as StorageApi),
  createFinanceStorage(storageCore as StorageApi),
  createTextbookStorage(storageCore as StorageApi),
  createDaycareCareStorage(storageCore as StorageApi)
);
