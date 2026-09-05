import { useMemo, useState, type FC, type MouseEvent } from 'react';
import { CheckCircle2, ChevronRight, Clock, MapPin, Piano, Users, XCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useStaffScope, useStorageRefresh } from '@/hooks';
import { StorageService } from '@/services/storage';
import { EmptyState, PageHeader } from '@/shared/components';
import type { AttendanceRecord, AttendanceStatus, ClassItem, LessonRecord, Student } from '@/types';
import { syncLessonHomeworkToWeeklyAssignment } from '../../services/lessonHomeworkSync';
import { notifyParentAbsence } from '@/core/academy/services/academyAlertService';
import { LessonSessionModal, type LessonSessionForm } from './LessonSessionModal';

const DAY_MAP: Record<number, string> = {
  1: '월',
  2: '화',
  3: '수',
  4: '목',
  5: '금',
  6: '토',
  0: '일',
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: '출석',
  late: '지각',
  early_leave: '조퇴',
  absent: '결석',
  make_up: '보강',
};

type SessionTarget = {
  student: Student;
  classItem: ClassItem;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

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

  const [target, setTarget] = useState<SessionTarget | null>(null);

  const today = todayIso();
  const todayKorean = DAY_MAP[new Date().getDay()] || '월';
  const currentHm = nowHm();

  const students = useMemo(
    () => scopeStudents(StorageService.getStudents()).filter((s) => s.status === 'active'),
    [scopeStudents, refreshKey]
  );
  const classes = useMemo(
    () =>
      scopeClasses(StorageService.getClasses())
        .filter((c) => c.daysOfWeek.includes(todayKorean as ClassItem['daysOfWeek'][number]))
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [scopeClasses, todayKorean, refreshKey]
  );
  const attendance = useMemo(() => StorageService.getAttendance(), [refreshKey]);
  const lessons = useMemo(
    () => scopeLessons(StorageService.getLessonRecords()),
    [scopeLessons, refreshKey]
  );

  const findAttendance = (studentId: string, classId: string): AttendanceRecord | undefined =>
    attendance.find((a) => a.date === today && a.studentId === studentId && a.classId === classId);

  const findLesson = (studentId: string): LessonRecord | undefined =>
    lessons.find((l) => l.date === today && l.studentId === studentId);

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

  const offerMakeup = (studentName: string) => {
    openConfirmDialog({
      title: '보강 일정',
      message: `${studentName} 원생 결석이 저장되었습니다. 지금 보강 일정을 잡을까요?`,
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
  ) => {
    const existingAtt = findAttendance(student.id, classItem.id);
    StorageService.saveAttendanceRecord({
      ...(existingAtt ? { id: existingAtt.id } : {}),
      date: today,
      studentId: student.id,
      studentName: student.name,
      classId: classItem.id,
      className: classItem.name,
      status,
      memo: memo?.trim() || undefined,
      createdBy: currentUser.name,
    });

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
  };

  const handleQuickStatus = (
    e: MouseEvent,
    student: Student,
    classItem: ClassItem,
    status: 'present' | 'absent'
  ) => {
    e.stopPropagation();
    persistAttendance(student, classItem, status);
    showToast(
      status === 'absent'
        ? `${student.name} 원생 결석 처리되었습니다.`
        : `${student.name} 원생 출석 처리되었습니다.`,
      'success'
    );
    if (status === 'absent') offerMakeup(student.name);
  };

  const handleSave = (form: LessonSessionForm) => {
    if (!target) return;
    const { student, classItem } = target;

    persistAttendance(student, classItem, form.status, form.memo);

    if (form.status !== 'absent') {
      if (!form.songTitle.trim()) {
        showToast('레슨 곡/교재를 입력해주세요.', 'warning');
        return;
      }
      const existingLesson = findLesson(student.id);
      StorageService.saveLessonRecord({
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
        memo: form.memo.trim(),
      });

      syncLessonHomeworkToWeeklyAssignment({
        studentId: student.id,
        songTitle: form.songTitle,
        homework: form.homework,
        staffId,
      });
    }

    showToast(
      form.status === 'absent'
        ? `${student.name} 원생 결석 처리되었습니다.`
        : `${student.name} 원생 레슨이 저장되었습니다.`,
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
      description="출석 · 레슨 노트 · 과제를 한 화면에서 저장합니다."
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
                  레슨 {classes.length}개 · 원생 {stats.total}명
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
        <div className="space-y-3">
          {classes.map((cls) => {
            const enrolled = students.filter((s) => s.classIds?.includes(cls.id));
            const classDone = enrolled.filter((s) => !!findAttendance(s.id, cls.id)).length;
            const isNow =
              !!cls.startTime &&
              !!cls.endTime &&
              cls.startTime <= currentHm &&
              currentHm < cls.endTime;
            const isNext =
              !isNow &&
              !!cls.startTime &&
              cls.startTime > currentHm &&
              classes.find((c) => c.startTime && c.startTime > currentHm)?.id === cls.id;

            return (
              <section
                key={cls.id}
                className={`rounded-2xl border bg-white overflow-hidden shadow-xs ${
                  isNow
                    ? 'border-indigo-300 ring-1 ring-indigo-200'
                    : isNext
                      ? 'border-emerald-200'
                      : 'border-slate-200'
                }`}
              >
                <div
                  className={`px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3 ${
                    isNow ? 'bg-indigo-50' : isNext ? 'bg-emerald-50/70' : 'bg-slate-50/80'
                  }`}
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="shrink-0 w-14 text-center">
                      <p className="font-mono text-sm font-black text-indigo-700">{cls.startTime}</p>
                      <p className="text-[10px] text-slate-400">~{cls.endTime}</p>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-slate-900 truncate">{cls.name}</p>
                        {isNow && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                            진행 중
                          </span>
                        )}
                        {isNext && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                            다음
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {cls.room}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Users className="w-3 h-3" />
                          {classDone}/{enrolled.length}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {enrolled.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">배정된 원생이 없습니다</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {enrolled.map((student) => {
                      const att = findAttendance(student.id, cls.id);
                      const lesson = findLesson(student.id);
                      const done = !!att;

                      return (
                        <li key={student.id}>
                          <div className="flex items-stretch gap-1 px-2 sm:px-3 py-2 min-h-[60px]">
                            <button
                              type="button"
                              onClick={() => setTarget({ student, classItem: cls })}
                              className="flex-1 text-left flex items-center gap-2.5 min-w-0 hover:bg-indigo-50/50 active:bg-indigo-50 rounded-xl px-1.5 py-1 transition-colors"
                            >
                              <span
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                                  done
                                    ? att?.status === 'absent'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {student.name.slice(0, 1)}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-slate-900 truncate">{student.name}</p>
                                <p className="text-xs text-slate-500 truncate mt-0.5">
                                  {done
                                    ? STATUS_LABEL[att!.status]
                                    : lesson?.songTitle || '미처리 · 탭하여 레슨'}
                                </p>
                              </div>
                              {done ? (
                                <CheckCircle2
                                  className={`w-4 h-4 shrink-0 ${
                                    att?.status === 'absent' ? 'text-rose-500' : 'text-emerald-500'
                                  }`}
                                />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                              )}
                            </button>

                            {!done && (
                              <div className="flex items-center gap-1 shrink-0 pr-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickStatus(e, student, cls, 'present')}
                                  className="min-h-[44px] min-w-[44px] px-2 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 hover:bg-emerald-100"
                                  aria-label={`${student.name} 출석`}
                                >
                                  출석
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleQuickStatus(e, student, cls, 'absent')}
                                  className="min-h-[44px] min-w-[44px] px-2 rounded-xl bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-100 hover:bg-rose-100"
                                  aria-label={`${student.name} 결석`}
                                >
                                  <XCircle className="w-4 h-4 mx-auto sm:hidden" />
                                  <span className="hidden sm:inline">결석</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <LessonSessionModal
        isOpen={!!target}
        student={target?.student ?? null}
        classItem={target?.classItem ?? null}
        date={today}
        existingLesson={target ? findLesson(target.student.id) || null : null}
        existingStatus={
          target
            ? findAttendance(target.student.id, target.classItem.id)?.status || null
            : null
        }
        onClose={() => setTarget(null)}
        onSave={handleSave}
      />
    </div>
  );
};
