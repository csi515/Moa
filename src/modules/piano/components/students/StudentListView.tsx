import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useModuleLabels } from '@/modules/piano';
import { StorageService } from '@/services/storage';
import { Student, StudentStatus } from '@/types';
import { StudentFormModal } from './StudentFormModal';
import { StudentDetailModal } from './StudentDetailModal';
import {
  formatCurrency,
  formatPhone,
  getLevelColor,
  getStudentStatusBadge
} from '@/utils/formatters';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  ArrowUpDown,
  BookOpen,
  Calendar,
  CreditCard,
  ChevronRight,
  Sparkles,
  School
} from 'lucide-react';

export const StudentListView: React.FC = () => {
  const { selectedStudentId, setSelectedStudentId, currentUser, refreshKey } = useApp();
  const labels = useModuleLabels();
  const isDirector = currentUser.role === 'director';

  const students = StorageService.getStudents();
  const teachers = StorageService.getTeachers();
  const classes = StorageService.getClasses();

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'joinDateDesc' | 'joinDateAsc' | 'name' | 'paymentDay'>('joinDateDesc');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  // If selectedStudentId was set from header or dashboard, auto-open detail modal
  React.useEffect(() => {
    if (selectedStudentId) {
      const found = students.find((s) => s.id === selectedStudentId);
      if (found) {
        setDetailStudent(found);
      }
    }
  }, [selectedStudentId, students]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // Teacher role check: if current user is teacher, option to filter their own students
        if (currentUser.role === 'teacher' && teacherFilter === 'MY' && currentUser.teacherId) {
          if (s.teacherId !== currentUser.teacherId) return false;
        }

        if (teacherFilter !== 'ALL' && teacherFilter !== 'MY' && s.teacherId !== teacherFilter) {
          return false;
        }

        if (classFilter !== 'ALL' && !s.classIds.includes(classFilter)) {
          return false;
        }

        if (statusFilter !== 'ALL' && s.status !== statusFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchPhone = s.parentPhone.includes(q) || (s.emergencyContact && s.emergencyContact.includes(q));
          const matchSchool = s.school.toLowerCase().includes(q);
          const matchParent = s.parentName.toLowerCase().includes(q);
          const matchNum = s.studentNumber.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchSchool && !matchParent && !matchNum) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'joinDateDesc') return b.joinDate.localeCompare(a.joinDate);
        if (sortBy === 'joinDateAsc') return a.joinDate.localeCompare(b.joinDate);
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko-KR');
        if (sortBy === 'paymentDay') return (a.paymentDay || 0) - (b.paymentDay || 0);
        return 0;
      });
  }, [students, searchQuery, teacherFilter, classFilter, statusFilter, sortBy, currentUser]);

  const activeCount = students.filter((s) => s.status === 'active').length;
  const leaveCount = students.filter((s) => s.status === 'leave').length;
  const withdrawnCount = students.filter((s) => s.status === 'withdrawn').length;

  const handleOpenDetail = (student: Student) => {
    setDetailStudent(student);
  };

  const handleCloseDetail = () => {
    setDetailStudent(null);
    setSelectedStudentId(null);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsFormModalOpen(true);
    setDetailStudent(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            {labels.customer.management}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            재원{labels.customer.singular} <strong className="text-indigo-600 font-bold">{activeCount}명</strong> / 휴원 {leaveCount}명 / 총 {students.length}명
          </p>
        </div>

        {isDirector && (
          <button
            onClick={() => {
              setEditingStudent(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            {labels.customer.add}
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Input */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="이름, 학부모 연락처, 학교, 번호 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                지우기
              </button>
            )}
          </div>

          {/* Teacher Filter */}
          <div>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="ALL">선생님 전체</option>
              {currentUser.role === 'teacher' && <option value="MY">⭐ 내 담당 원생만</option>}
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="ALL">수업반 전체</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
            >
              <option value="ALL">상태 전체 ({students.length})</option>
              <option value="active">재원 ({activeCount})</option>
              <option value="leave">휴원 ({leaveCount})</option>
              <option value="withdrawn">퇴원 ({withdrawnCount})</option>
            </select>
          </div>
        </div>

        {/* Sort & Count strip */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <span>검색된 원생: <strong className="text-slate-800">{filteredStudents.length}명</strong></span>
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="joinDateDesc">등록일 최신순</option>
              <option value="joinDateAsc">등록일 과거순</option>
              <option value="name">이름 가나다순</option>
              <option value="paymentDay">수납일순</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student List View */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">조건에 일치하는 원생이 없습니다.</p>
          <p className="text-xs text-slate-400">검색어나 필터를 초기화해보세요.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">원생 번호</th>
                    <th className="py-3.5 px-4">이름 / 성별</th>
                    <th className="py-3.5 px-4">학교 / 학년</th>
                    <th className="py-3.5 px-4">레벨 / 과정</th>
                    <th className="py-3.5 px-4">담당 선생님</th>
                    <th className="py-3.5 px-4">학부모 연락처</th>
                    {isDirector && <th className="py-3.5 px-4">수강료 / 수납일</th>}
                    <th className="py-3.5 px-4">상태</th>
                    <th className="py-3.5 px-4 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => {
                    const badge = getStudentStatusBadge(st.status);
                    return (
                      <tr
                        key={st.id}
                        onClick={() => handleOpenDetail(st)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                          {st.studentNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-2xs"
                              style={{ backgroundColor: st.avatarColor || '#4f46e5' }}
                            >
                              {st.name.slice(0, 1)}
                            </div>
                            <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {st.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({st.gender === 'F' ? '여' : '남'})
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {st.school} <span className="font-medium text-slate-800">[{st.grade}]</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] border ${getLevelColor(st.level)}`}>
                            {st.level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {st.teacherName}
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${st.parentPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-600 hover:underline font-semibold"
                            >
                              {formatPhone(st.parentPhone)}
                            </a>
                            <span className="text-slate-400 text-[10px]">({st.parentName})</span>
                          </div>
                        </td>
                        {isDirector && (
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{formatCurrency(st.tuitionFee)}</span>
                            <span className="text-slate-400 text-[11px] ml-1">/ 매월 {st.paymentDay}일</span>
                          </td>
                        )}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(st);
                            }}
                            className="p-1.5 text-slate-400 group-hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredStudents.map((st) => {
              const badge = getStudentStatusBadge(st.status);
              return (
                <div
                  key={st.id}
                  onClick={() => handleOpenDetail(st)}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs active:bg-slate-50 transition-all cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl text-white font-extrabold text-sm flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: st.avatarColor || '#4f46e5' }}
                      >
                        {st.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                          <span className="text-[10px] text-slate-400">({st.gender === 'F' ? '여' : '남'})</span>
                          <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {st.school} {st.grade} | {st.teacherName}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${getLevelColor(st.level)}`}>
                      {st.level}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={`tel:${st.parentPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-indigo-600 font-semibold font-mono"
                      >
                        {formatPhone(st.parentPhone)}
                      </a>
                    </div>
                    {isDirector && (
                      <span className="font-bold text-slate-800">
                        {formatCurrency(st.tuitionFee)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modals */}
      <StudentFormModal
        student={editingStudent}
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingStudent(null);
        }}
        onSaved={(saved) => {
          setDetailStudent(saved);
        }}
      />

      <StudentDetailModal
        student={detailStudent}
        isOpen={Boolean(detailStudent)}
        onClose={handleCloseDetail}
        onEdit={handleOpenEdit}
      />
    </div>
  );
};
