/**
 * 피아노 시간표 배치 로직 단위 테스트
 * 실행: npm run test:timetable-placement
 * (또는 node --experimental-test-module-mocks --import tsx src/modules/piano/components/schedule/pianoTimetablePlacement.test.ts)
 */
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import type { AttendanceRecord, ClassItem, Student, Teacher } from '@/types';

type Store = {
  classes: ClassItem[];
  students: Student[];
  attendance: AttendanceRecord[];
  saveAttendanceCalls: number;
};

function makeTeacher(partial?: Partial<Teacher>): Teacher {
  return {
    id: 't1',
    name: '김선생',
    phone: '01000000000',
    hireDate: '2024-01-01',
    status: 'active',
    ...partial,
  };
}

function makeStudent(partial?: Partial<Student>): Student {
  return {
    id: 's1',
    studentNumber: 'STU-1',
    name: '홍길동',
    gender: 'M',
    birthDate: '2015-01-01',
    school: '테스트초',
    grade: '초3',
    joinDate: '2024-01-01',
    status: 'active',
    teacherId: 't1',
    teacherName: '김선생',
    classIds: [],
    level: '초급',
    tuitionFee: 0,
    paymentDay: 1,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...partial,
  };
}

function makeClass(partial: Partial<ClassItem> & Pick<ClassItem, 'id' | 'daysOfWeek' | 'startTime'>): ClassItem {
  return {
    name: partial.name || `${partial.daysOfWeek[0]} ${partial.startTime}`,
    teacherId: 't1',
    teacherName: '김선생',
    endTime: '16:20',
    capacity: 4,
    room: '연습실',
    color: '#4f46e5',
    ...partial,
  };
}

function installStorageMock(store: Store) {
  let classSeq = 100;
  const StorageService = {
    getSettings: () => ({ rooms: [{ id: 'r1', name: '연습실1' }] }),
    getStudents: () => store.students.map((s) => ({ ...s, classIds: [...s.classIds] })),
    getClasses: () => store.classes.map((c) => ({ ...c, daysOfWeek: [...c.daysOfWeek] })),
    getAttendance: () => store.attendance.map((a) => ({ ...a })),
    saveAttendance: () => {
      store.saveAttendanceCalls += 1;
      throw new Error('출결 저장이 호출되면 안 됩니다');
    },
    saveClass: (cls: Omit<ClassItem, 'id'> & { id?: string }): ClassItem => {
      const id = cls.id || `cls-auto-${++classSeq}`;
      const saved: ClassItem = { ...(cls as ClassItem), id };
      const idx = store.classes.findIndex((c) => c.id === id);
      if (idx >= 0) store.classes[idx] = saved;
      else store.classes.push(saved);
      return saved;
    },
    saveStudent: (
      student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'> & {
        id?: string;
        createdAt?: string;
      }
    ): Student => {
      const id = student.id || 's-new';
      const saved: Student = {
        ...makeStudent(),
        ...student,
        id,
        classIds: [...(student.classIds || [])],
        updatedAt: '2024-06-01T00:00:00.000Z',
        createdAt: student.createdAt || '2024-01-01T00:00:00.000Z',
      } as Student;
      const idx = store.students.findIndex((s) => s.id === id);
      if (idx >= 0) store.students[idx] = saved;
      else store.students.push(saved);
      return saved;
    },
  };

  mock.module('@/services/storage', {
    namedExports: { StorageService },
  });

  return StorageService;
}

async function run(): Promise<void> {
  const store: Store = {
    classes: [],
    students: [],
    attendance: [
      {
        id: 'att-keep',
        date: '2024-06-01',
        studentId: 's1',
        studentName: '홍길동',
        classId: 'cls-mon-1500',
        className: '월 15:00',
        status: 'present',
        createdBy: 'test',
      },
    ],
    saveAttendanceCalls: 0,
  };

  installStorageMock(store);

  const {
    assignStudentToSlot,
    moveStudentToSlot,
    ensureEditableSlotClass,
    findEditableSlotClass,
    getPlacementsForSlot,
    isEditableSlotClass,
  } = await import('./pianoTimetablePlacement');

  const teacher = makeTeacher();
  const teachers = [teacher];

  // --- 1. 기존 단일 요일/시간 반이 있으면 재사용 ---
  const existingSlot = makeClass({
    id: 'cls-mon-1500',
    daysOfWeek: ['월'],
    startTime: '15:00',
    endTime: '15:50',
    name: '월 15:00',
  });
  store.classes = [existingSlot];
  store.students = [makeStudent({ id: 's1', classIds: [] })];

  const ensured = ensureEditableSlotClass({
    classes: store.classes,
    day: '월',
    startTime: '15:00',
    teachers,
    createIfMissing: true,
  });
  assert.ok(ensured);
  assert.equal(ensured.id, 'cls-mon-1500');
  assert.equal(store.classes.length, 1, '기존 반을 재사용하므로 반이 추가되면 안 됨');

  const assignedReuse = assignStudentToSlot({
    student: store.students[0],
    day: '월',
    startTime: '15:00',
    classes: store.classes,
    teachers,
    createClassIfMissing: true,
  });
  assert.equal(assignedReuse.ok, true);
  if (assignedReuse.ok) {
    assert.equal(assignedReuse.classItem.id, 'cls-mon-1500');
    assert.equal(assignedReuse.createdClass, false);
  }

  // --- 2. 학생 배치 시 classIds가 해당 반을 포함 ---
  assert.ok(assignedReuse.ok);
  if (assignedReuse.ok) {
    assert.ok(assignedReuse.student.classIds.includes('cls-mon-1500'));
    assert.ok(store.students[0].classIds.includes('cls-mon-1500'));
  }

  // --- 6. 30분 단위 시작 시간(15:30) 정상 처리 ---
  const slot1530 = makeClass({
    id: 'cls-mon-1530',
    daysOfWeek: ['월'],
    startTime: '15:30',
    endTime: '16:20',
    name: '월 15:30',
  });
  store.classes.push(slot1530);
  assert.equal(isEditableSlotClass(slot1530, '월', '15:30'), true);
  assert.equal(findEditableSlotClass(store.classes, '월', '15:30')?.id, 'cls-mon-1530');

  const studentFor1530 = makeStudent({ id: 's2', name: '김영희', classIds: [] });
  store.students.push(studentFor1530);
  const assigned1530 = assignStudentToSlot({
    student: studentFor1530,
    day: '월',
    startTime: '15:30',
    classes: store.classes,
    teachers,
    createClassIfMissing: false,
  });
  assert.equal(assigned1530.ok, true);
  if (assigned1530.ok) {
    assert.equal(assigned1530.classItem.id, 'cls-mon-1530');
    assert.ok(assigned1530.student.classIds.includes('cls-mon-1530'));
  }
  const placements1530 = getPlacementsForSlot(store.students, store.classes, '월', '15:30');
  assert.ok(placements1530.some((p) => p.student.id === 's2' && p.classItem.id === 'cls-mon-1530'));

  // --- 3. 학생 이동 시 기존 같은 요일의 배치가 정리됨 ---
  const fromClass = makeClass({
    id: 'cls-tue-1400',
    daysOfWeek: ['화'],
    startTime: '14:00',
    endTime: '14:50',
  });
  const toClass = makeClass({
    id: 'cls-tue-1600',
    daysOfWeek: ['화'],
    startTime: '16:00',
    endTime: '16:50',
  });
  const mover = makeStudent({
    id: 's-move',
    name: '이동학생',
    classIds: [fromClass.id],
  });
  store.classes = [fromClass, toClass];
  store.students = [mover];

  const moved = moveStudentToSlot({
    student: mover,
    from: { classItem: fromClass, day: '화', startTime: '14:00' },
    toDay: '화',
    toStartTime: '16:00',
    classes: store.classes,
    teachers,
  });
  assert.equal(moved.ok, true);
  if (moved.ok) {
    assert.equal(moved.student.classIds.includes(fromClass.id), false);
    assert.equal(moved.student.classIds.includes(toClass.id), true);
  }

  // 같은 요일 다른 단일 슬롯 이동 (assign 경로)
  const monA = makeClass({ id: 'cls-wed-1000', daysOfWeek: ['수'], startTime: '10:00', endTime: '10:50' });
  const monB = makeClass({ id: 'cls-wed-1100', daysOfWeek: ['수'], startTime: '11:00', endTime: '11:50' });
  const sameDayStudent = makeStudent({ id: 's-same-day', classIds: [monA.id] });
  store.classes = [monA, monB];
  store.students = [sameDayStudent];
  const reassigned = assignStudentToSlot({
    student: sameDayStudent,
    day: '수',
    startTime: '11:00',
    classes: store.classes,
    teachers,
  });
  assert.equal(reassigned.ok, true);
  if (reassigned.ok) {
    assert.equal(reassigned.student.classIds.includes(monA.id), false);
    assert.equal(reassigned.student.classIds.includes(monB.id), true);
  }

  // --- 5. 여러 요일 반은 기존 소속을 함부로 삭제하지 않음 ---
  const multiDay = makeClass({
    id: 'cls-multi',
    name: '월수금 정규반',
    daysOfWeek: ['월', '수', '금'],
    startTime: '15:00',
    endTime: '15:50',
  });
  const singleMon = makeClass({
    id: 'cls-single-mon-1600',
    daysOfWeek: ['월'],
    startTime: '16:00',
    endTime: '16:50',
  });
  const singleMonTarget = makeClass({
    id: 'cls-single-mon-1700',
    daysOfWeek: ['월'],
    startTime: '17:00',
    endTime: '17:50',
  });
  const multiStudent = makeStudent({
    id: 's-multi',
    classIds: [multiDay.id, singleMon.id],
  });
  store.classes = [multiDay, singleMon, singleMonTarget];
  store.students = [multiStudent];

  const keepMulti = assignStudentToSlot({
    student: multiStudent,
    day: '월',
    startTime: '17:00',
    classes: store.classes,
    teachers,
  });
  assert.equal(keepMulti.ok, true);
  if (keepMulti.ok) {
    assert.ok(
      keepMulti.student.classIds.includes(multiDay.id),
      '복수 요일 반 소속은 유지되어야 함'
    );
    assert.equal(keepMulti.student.classIds.includes(singleMon.id), false);
    assert.ok(keepMulti.student.classIds.includes(singleMonTarget.id));
  }

  // --- 7. 동일 학생을 같은 시간에 중복 배치할 수 없음 ---
  const dupClass = makeClass({
    id: 'cls-thu-1300',
    daysOfWeek: ['목'],
    startTime: '13:00',
    endTime: '13:50',
  });
  const dupStudent = makeStudent({ id: 's-dup', classIds: [dupClass.id] });
  store.classes = [dupClass];
  store.students = [dupStudent];
  const duplicate = assignStudentToSlot({
    student: dupStudent,
    day: '목',
    startTime: '13:00',
    classes: store.classes,
    teachers,
  });
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.match(duplicate.message, /이미 해당 시간대/);
  }

  // --- 4. 출결 데이터는 변경되지 않음 ---
  const attendanceBefore = JSON.stringify(store.attendance);
  store.saveAttendanceCalls = 0;
  // 배치·이동 시나리오를 한 번 더 실행해도 출결 스냅샷 유지
  const attStudent = makeStudent({ id: 's-att', classIds: [] });
  const attClass = makeClass({
    id: 'cls-fri-0900',
    daysOfWeek: ['금'],
    startTime: '09:00',
    endTime: '09:50',
  });
  store.classes = [attClass];
  store.students = [attStudent];
  const attAssign = assignStudentToSlot({
    student: attStudent,
    day: '금',
    startTime: '09:00',
    classes: store.classes,
    teachers,
  });
  assert.equal(attAssign.ok, true);
  assert.equal(store.saveAttendanceCalls, 0);
  assert.equal(JSON.stringify(store.attendance), attendanceBefore);

  console.log('pianoTimetablePlacement.test.ts: all assertions passed');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
