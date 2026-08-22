import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useStaffScope } from '@/hooks';
import { StorageService } from '@/services/storage';
import { AttendanceRecord, AttendanceStatus, Student } from '@/types';
import {
  formatKoreanDate,
  formatPhone,
  getAttendanceBadge,
  getLevelColor
} from '@/utils/formatters';
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  Sparkles,
  Users,
  Search,
  Filter,
  FileCheck,
  Phone
} from 'lucide-react';
import { AbsentReasonModal } from './AbsentReasonModal';

export const AttendanceView: React.FC = () => {
  const { showToast, currentUser, setSelectedStudentId, setActiveTab } = useApp();
  const { isScoped, scopeStudents, scopeClasses } = useStaffScope();

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [absentModalStudent, setAbsentModalStudent] = useState<Student | null>(null);

  const students = useMemo(() => scopeStudents(StorageService.getStudents()), [scopeStudents]);
  const classes = useMemo(() => scopeClasses(StorageService.getClasses()), [scopeClasses]);
  const allAttendance = StorageService.getAttendance();

  // Handle previous / next day
  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Filter students based on class selection
  const relevantStudents = useMemo(() => {
    return students.filter((s) => {
      if (s.status !== 'active') return false;
      if (selectedClassId !== 'ALL' && !s.classIds?.includes(selectedClassId)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.parentPhone.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedClassId, searchQuery]);

  // Map student attendance for selected date
  const studentAttendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    allAttendance
      .filter((a) => a.date === selectedDate)
      .forEach((a) => {
        map.set(a.studentId, a);
      });
    return map;
  }, [allAttendance, selectedDate]);

  // Calculate statistics for selected date
  const stats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let earlyLeave = 0;
    let makeUp = 0;
    let unmarked = 0;

    relevantStudents.forEach((st) => {
      const record = studentAttendanceMap.get(st.id);
      if (!record) {
        unmarked++;
      } else {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'late') late++;
        else if (record.status === 'early_leave') earlyLeave++;
        else if (record.status === 'make_up') makeUp++;
      }
    });

    const recordedTotal = present + absent + late + earlyLeave + makeUp;
    const rate = recordedTotal > 0 ? Math.round(((present + makeUp) / recordedTotal) * 100) : 0;

    return { present, absent, late, earlyLeave, makeUp, unmarked, rate, total: relevantStudents.length };
  }, [relevantStudents, studentAttendanceMap]);

  // Set individual student attendance status
  const handleSetStatus = (student: Student, status: AttendanceStatus, customAbsentReason?: string) => {
    if (status === 'absent' && customAbsentReason === undefined) {
      setAbsentModalStudent(student);
      return;
    }

    const assignedClass = classes.find((c) => student.classIds?.includes(c.id)) || classes[0];

    StorageService.saveAttendanceRecord({
      date: selectedDate,
      studentId: student.id,
      studentName: student.name,
      classId: assignedClass ? assignedClass.id : 'c-default',
      className: assignedClass ? assignedClass.name : '개인레슨',
      status,
      absentReason: customAbsentReason,
      createdBy: currentUser.name
    });

    const statusLabel =
      status === 'present'
        ? '출석'
        : status === 'absent'
        ? '결석'
        : status === 'late'
        ? '지각'
        : status === 'early_leave'
        ? '조퇴'
        : '보강';

    showToast(`${student.name} 원생: ${statusLabel} 처리되었습니다.`, 'success');
  };

  // Batch Mark All Unmarked as Present
  const handleBatchAllPresent = () => {
    relevantStudents.forEach((st) => {
      const assignedClass = classes.find((c) => studentAttendanceMap.get(st.id)?.classId === c.id || st.classIds?.includes(c.id)) || classes[0];
      StorageService.saveAttendanceRecord({
        date: selectedDate,
        studentId: st.id,
        studentName: st.name,
        classId: assignedClass ? assignedClass.id : 'c-default',
        className: assignedClass ? assignedClass.name : '개인레슨',
        status: 'present',
        createdBy: currentUser.name
      });
    });
    showToast(`${relevantStudents.length}명 원생 전체 출석 처리 완료`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-indigo-600" />
            출결 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            실시간 원생 출석/결석/지각/보강 체크 및 이력 관리
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="이전 날짜"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="다음 날짜"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            className="px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer ml-1"
          >
            오늘
          </button>
        </div>
      </div>

      {/* Date Attendance Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">대상 원생</p>
          <p className="text-lg font-black text-slate-900 mt-1">{stats.total}명</p>
        </div>
        <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200 shadow-xs">
          <p className="text-xs text-emerald-700 font-bold">출석</p>
          <p className="text-lg font-black text-emerald-800 mt-1">{stats.present}명</p>
        </div>
        <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200 shadow-xs">
          <p className="text-xs text-rose-700 font-bold">결석</p>
          <p className="text-lg font-black text-rose-800 mt-1">{stats.absent}명</p>
        </div>
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-xs">
          <p className="text-xs text-amber-700 font-bold">지각 / 조퇴</p>
          <p className="text-lg font-black text-amber-800 mt-1">{stats.late + stats.earlyLeave}명</p>
        </div>
        <div className="bg-purple-50/80 p-4 rounded-2xl border border-purple-200 shadow-xs">
          <p className="text-xs text-purple-700 font-bold">보강</p>
          <p className="text-lg font-black text-purple-800 mt-1">{stats.makeUp}명</p>
        </div>
        <div className="bg-indigo-50/80 p-4 rounded-2xl border border-indigo-200 shadow-xs">
          <p className="text-xs text-indigo-700 font-bold">출석률</p>
          <p className="text-lg font-black text-indigo-900 mt-1">{stats.rate}%</p>
        </div>
      </div>

      {/* Filter and Quick Action Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
          >
            <option value="ALL">전체 수업반</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.daysOfWeek.join(',')})
              </option>
            ))}
          </select>

          {/* Search input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="원생 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleBatchAllPresent}
          className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          전체 원생 일괄 출석 처리
        </button>
      </div>

      {/* Attendance Check Grid/List */}
      <div className="space-y-3">
        {relevantStudents.map((st) => {
          const record = studentAttendanceMap.get(st.id);
          const currentStatus = record?.status;
          const assignedClass = classes.find((c) => st.classIds?.includes(c.id));

          return (
            <div
              key={st.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Student basic info */}
              <div className="flex items-center gap-3.5">
                <div
                  className="w-10 h-10 rounded-2xl text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0"
                  style={{ backgroundColor: st.avatarColor || '#4f46e5' }}
                >
                  {st.name.slice(0, 1)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setActiveTab('students');
                      }}
                      className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors text-left"
                    >
                      {st.name}
                    </button>
                    <span className={`text-[10px] px-2 py-0.2 rounded-md font-bold border ${getLevelColor(st.level)}`}>
                      {st.level}
                    </span>
                    {assignedClass && (
                      <span className="text-[10px] px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {assignedClass.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span>{st.school} {st.grade}</span>
                    <span>•</span>
                    <span>{st.teacherName}</span>
                    <span>•</span>
                    <a
                      href={`tel:${st.parentPhone}`}
                      className="text-indigo-600 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {formatPhone(st.parentPhone)}
                    </a>
                  </div>
                  {record?.absentReason && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      ⚠️ 사유: {record.absentReason}
                    </p>
                  )}
                  {record?.memo && (
                    <p className="text-xs text-slate-600 mt-0.5 italic">
                      💬 {record.memo}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-stretch md:self-auto shrink-0">
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 grow">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(st, 'present')}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                      currentStatus === 'present'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>출석</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(st, 'absent')}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                      currentStatus === 'absent'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>결석</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(st, 'late')}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                      currentStatus === 'late'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>지각</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(st, 'early_leave')}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                      currentStatus === 'early_leave'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200'
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>조퇴</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(st, 'make_up')}
                    className={`py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 ${
                      currentStatus === 'make_up'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm scale-105'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>보강</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <AbsentReasonModal
        isOpen={Boolean(absentModalStudent)}
        student={absentModalStudent}
        onClose={() => setAbsentModalStudent(null)}
        onConfirm={(reason) => {
          if (absentModalStudent) {
            handleSetStatus(absentModalStudent, 'absent', reason);
            setAbsentModalStudent(null);
          }
        }}
      />
    </div>
  );
};
