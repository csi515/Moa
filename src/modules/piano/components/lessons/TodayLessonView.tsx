import { useEffect, useMemo, useState, type FC, type MouseEvent } from 'react';
import { Clock, CreditCard, Piano } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { StudentService } from '@/core/students';
import { LessonService } from '@/core/lessons';
import { TuitionService } from '@/core/finance';
import { EmptyState, PageHeader } from '@/shared/components';
import type { AttendanceRecord, AttendanceStatus, ClassItem, LessonRecord, Student } from '@/types';
import { upsertById } from '@/shared/utils/listUpdate';
import { todayIsoLocal } from '@/shared/utils/localDate';
import { syncLessonHomeworkToWeeklyAssignment } from '../../services/lessonHomeworkSync';
import { syncLessonCurriculumProgress } from '../../services/lessonCurriculumSync';
import { applySessionPassForAttendance } from '../../services/lessonPassConsume';
import { notifyParentAbsence } from '@/core/academy/services/academyAlertService';
import { consumeOpenUncheckedLessons } from '@/core/customer/studentJoinInbox';
import { LessonSessionModal, type LessonSessionForm } from './LessonSessionModal';
import {
  TodayLessonClassList,
  type TodayLessonSessionTarget,
} from './TodayLessonClassList';

const DAY_MAP: Record<number, string> = {
  0: '일',
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
};

function nowHm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 오늘 레슨 타임라인 — 원탭 출결 + 레슨 노트 */
export const TodayLessonView: FC<{ compactHeader?: boolean; embedded?: boolean }> = ({
  compactHeader = false,
  embedded = false,
}) => {
  const { currentUser, showToast, openConfirmDialog, setActiveTab } = useApp();
  const refreshKey = useStorageRefresh();
  const { staffId, scopeStudents, scopeClasses, scopeLessons } = useStaffScope();

  const [target, setTarget] = useState<TodayLessonSessionTarget | null>(null);
  const [uncheckedOnly, setUncheckedOnly] = useState(false);

  useEffect(() => {
    if (consumeOpenUncheckedLessons()) setUncheckedOnly(true);
  }, []);

  const today = todayIsoLocal();
  const todayKorean = DAY_MAP[new Date().getDay()] || '월';
  const currentHm = nowHm();

  const students = useMemo(
    () => scopeStudents(StudentService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const classes = useMemo(
    () =>
      scopeClasses(StorageService.getClasses())
        .filter((c) => c.daysOfWeek.includes(todayKorean as ClassItem['daysOfWeek'][number]))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [scopeClasses, todayKorean, refreshKey]
  );

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => StorageService.getAttendance());
  const [lessons, setLessons] = useState<LessonRecord[]>(() =>
    scopeLessons(LessonService.getLessonRecords())
  );

  useEffect(() => {
    setAttendance(StorageService.getAttendance());
    setLessons(scopeLessons(LessonService.getLessonRecords()));
  }, [refreshKey, scopeLessons]);

  const findAttendance = (studentId: string, classId: string): AttendanceRecord | undefined =>
    attendance.find((a) => a.date === today && a.studentId === studentId && a.classId === classId);

  const findLesson = (studentId: string, classId: string): LessonRecord | undefined =>
    lessons.find((l) => l.date === today && l.studentId === studentId && l.classId === classId);

  const stats = useMemo(() => {
    let total = 0;
    let done = 0;
    for (const cls of classes) {
      const enrolled = students.filter((s) => s.classIds?.includes(cls.id));
      total += enrolled.length;
      done += enrolled.filter((s) => !!findAttendance(s.id, cls.id)).length;
    }
    return { total, done };
  }, [classes, students, attendance, today]);

  const progressPct = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

  const unpaidTodayStudents = useMemo(() => {
    return students.filter((student) => {
      const summary = TuitionService.getStudentBillingSummary(student.id);
      return (summary.grandUnpaid ?? summary.totalUnpaid) > 0;
    }).length;
  }, [students, refreshKey]);

  const offerMakeup = (studentName: string) => {
    openConfirmDialog({
      title: '보강 일정',
      message: `${studentName} 학생 결석이 저장되었습니다. 지금 보강 일정을 잡을까요?`,
      confirmText: '보강 일정 잡기',
      cancelText: '나중에',
      onConfirm: () => setActiveTab('makeups'),
    });
  };

  const persistAttendance = (
    student: Student,
    classItem: ClassItem,
    status: AttendanceStatus,
    memo?: string
  ): boolean => {
    const existingAtt = findAttendance(student.id, classItem.id);
    const passResult = applySessionPassForAttendance({
      student,
      nextStatus: status,
      previous: existingAtt || null,
      date: today,
    });
    if (passResult.warning) {
      showToast(passResult.warning, 'warning');
      return false;
    }

    const saved = StorageService.saveAttendanceRecord({
      ...(existingAtt ? { id: existingAtt.id } : {}),
      date: today,
      studentId: student.id,
      studentName: student.name,
      classId: classItem.id,
      className: classItem.name,
      status,
      memo: memo?.trim() || undefined,
      createdBy: currentUser.name,
      sessionPassId: passResult.sessionPassId,
    });
    setAttendance((prev) => upsertById(prev, saved));

    if (status === 'absent') {
      notifyParentAbsence({
        studentId: student.id,
        studentName: student.name,
        parentPhone: student.parentPhone,
        className: classItem.name,
        date: today,
        reason: memo?.trim() || undefined,
      });
    }
    return true;
  };

  const handleQuickStatus = (
    e: MouseEvent,
    student: Student,
    classItem: ClassItem,
    status: 'present' | 'absent'
  ) => {
    e.stopPropagation();
    if (!persistAttendance(student, classItem, status)) return;
    showToast(
      status === 'absent'
        ? `${student.name} 학생 결석 처리되었습니다.`
        : `${student.name} 학생 출석 처리되었습니다.`,
      'success'
    );
    if (status === 'absent') {
      offerMakeup(student.name);
      return;
    }
    openConfirmDialog({
      title: '레슨 노트',
      message: `${student.name} 학생 출석이 저장되었습니다. 이어서 노트·과제를 작성할까요?`,
      confirmText: '노트 작성',
      cancelText: '나중에',
      onConfirm: () => setTarget({ student, classItem }),
    });
  };

  const sessionHints = useMemo(() => {
    if (!target) {
      return { songSuggestions: [] as string[], homeworkHint: '', inProgressSong: '' };
    }
    const studentId = target.student.id;
    const weekStart = StorageService.getCurrentWeekStart();
    const weekAssignment = StorageService.getWeeklyAssignments(studentId).find(
      (a) => a.weekStart === weekStart
    );
    const curriculumItems = StorageService.getCurriculumItems();
    const progress = StorageService.getCurriculumProgress(studentId);
    const inProgressIds = new Set(
      progress.filter((p) => p.status === 'in_progress').map((p) => p.curriculumItemId)
    );
    const inProgressSong =
      curriculumItems.find((it) => inProgressIds.has(it.id))?.title || '';
    const recentSongs = lessons
      .filter((l) => l.studentId === studentId)
      .slice(0, 8)
      .map((l) => l.songTitle)
      .filter(Boolean);
    const curriculumTitles = curriculumItems.map((it) => it.title).filter(Boolean);
    const assignmentTitles = (weekAssignment?.items || []).map((it) => it.songTitle);
    const songSuggestions = Array.from(
      new Set([...recentSongs, ...assignmentTitles, ...curriculumTitles, inProgressSong].filter(Boolean))
    ).slice(0, 12);
    const homeworkHint =
      weekAssignment?.items?.find((it) => !it.completed)?.instructions ||
      weekAssignment?.items?.[0]?.instructions ||
      '';
    return { songSuggestions, homeworkHint, inProgressSong };
  }, [target, lessons, refreshKey]);

  const handleSave = (form: LessonSessionForm) => {
    if (!target) return;
    const { student, classItem } = target;

    if (form.status !== 'absent' && !form.songTitle.trim()) {
      showToast('레슨 곡/교재를 입력해주세요.', 'warning');
      return;
    }

    if (!persistAttendance(student, classItem, form.status, form.memo)) return;

    if (form.status !== 'absent') {
      const existingLesson = findLesson(student.id, classItem.id);
      const savedLesson = LessonService.saveLessonRecord({
        ...(existingLesson ? { id: existingLesson.id } : {}),
        studentId: student.id,
        studentName: student.name,
        classId: classItem.id,
        className: classItem.name,
        teacherId: staffId || classItem.teacherId || StorageService.getTeachers()[0]?.id || '',
        teacherName: currentUser.name,
        date: today,
        songTitle: form.songTitle.trim(),
        progress: form.progress.trim(),
        lessonContent: form.lessonContent.trim(),
        strengths: form.strengths.trim(),
        weaknesses: form.weaknesses.trim(),
        homework: form.homework.trim(),
        nextPlan: form.nextPlan.trim(),
        memo: form.memo.trim(),
      });
      setLessons((prev) => upsertById(prev, savedLesson));

      syncLessonHomeworkToWeeklyAssignment({
        studentId: student.id,
        songTitle: form.songTitle,
        homework: form.homework,
        staffId,
      });

      syncLessonCurriculumProgress({
        studentId: student.id,
        songTitle: form.songTitle,
        nextSongTitle: form.nextPlan,
      });
    }

    showToast(
      form.status === 'absent'
        ? `${student.name} 학생 결석 처리되었습니다.`
        : `${student.name} 학생 레슨이 저장되었습니다.`,
      'success'
    );
    setTarget(null);
    if (form.status === 'absent') offerMakeup(student.name);
  };

  const headerBlock = compactHeader || embedded ? (
    <div className="flex items-end justify-between gap-3 px-0.5">
      <div>
        <p className="text-[11px] font-semibold text-indigo-600">
          {todayKorean}요일 · {today}
        </p>
        <h2 className={`font-extrabold text-slate-900 tracking-tight ${embedded ? 'text-sm' : 'text-lg'}`}>
          오늘 레슨
        </h2>
      </div>
      <p className="text-xs font-bold text-slate-500 tabular-nums">
        {stats.done}/{stats.total} 완료
      </p>
    </div>
  ) : (
    <PageHeader
      icon={<Piano className="w-6 h-6" />}
      title="오늘 레슨"
      description="출석 · 레슨 노트 · 과제 · 다음곡을 한 화면에서 저장합니다."
    />
  );

  return (
    <div className={embedded ? 'space-y-3' : 'space-y-4 pb-8'}>
      {headerBlock}

      {!embedded && (
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-4">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">처리 현황</p>
                <p className="text-sm font-bold text-slate-900">
                  레슨 {classes.length}개 · 학생 {stats.total}명
                </p>
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-700 tabular-nums">{progressPct}%</p>
          </div>
          <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {unpaidTodayStudents > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className="mt-3 w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-xs font-bold text-amber-900"
            >
              <CreditCard className="w-4 h-4" />
              오늘 레슨 학생 중 미납 {unpaidTodayStudents}명 · 수강료
            </button>
          )}
        </div>
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8" />}
          title="오늘 예정된 레슨이 없습니다"
          description="정규 레슨 일정에 오늘 요일이 포함되어 있는지 확인해 주세요."
          action={
            <button
              type="button"
              onClick={() => setActiveTab('classes')}
              className="text-xs font-bold text-indigo-600 min-h-[44px]"
            >
              정규 레슨 관리로 이동
            </button>
          }
        />
      ) : (
        <TodayLessonClassList
          classes={classes}
          students={students}
          currentHm={currentHm}
          uncheckedOnly={uncheckedOnly}
          findAttendance={findAttendance}
          findLesson={findLesson}
          onOpenSession={setTarget}
          onQuickStatus={handleQuickStatus}
        />
      )}

      <LessonSessionModal
        isOpen={!!target}
        student={target?.student ?? null}
        classItem={target?.classItem ?? null}
        date={today}
        existingLesson={
          target ? findLesson(target.student.id, target.classItem.id) || null : null
        }
        existingStatus={
          target
            ? findAttendance(target.student.id, target.classItem.id)?.status || null
            : null
        }
        songSuggestions={sessionHints.songSuggestions}
        homeworkHint={sessionHints.homeworkHint}
        inProgressSong={sessionHints.inProgressSong}
        onClose={() => setTarget(null)}
        onSave={handleSave}
      />
    </div>
  );
};
