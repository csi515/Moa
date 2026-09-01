import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { getIndustryPlugin } from '@/core/industry/registry';
import { useModuleLabels } from '@/core/labels';
import { studentUsesShuttleService } from '@/core/transport';
import { useStaffScope } from '@/hooks';
import { studentMatchesGuardianQuery } from '@/core/parent/guardianHelpers';
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
import { PageHeader, SummaryMetricCard, FilterBar, SearchField } from '@/shared/components';
import {
  Users,
  UserPlus,
  Phone,
  ArrowUpDown,
  BookOpen,
  Calendar,
  CreditCard,
  ChevronRight,
  Sparkles,
  School,
  Bus,
} from 'lucide-react';

export const StudentListView: React.FC = () => {
  const { selectedStudentId, setSelectedStudentId, selectedStudentDetailTab, setSelectedStudentDetailTab, refreshKey } = useApp();
  const { industry } = usePermissions();
  const showPickupFields = getIndustryPlugin(industry).showPickupFields;
  const labels = useModuleLabels();
  const { isScoped, staffId, scopeStudents } = useStaffScope();

  const allStudents = StorageService.getStudents();
  const students = useMemo(() => scopeStudents(allStudents), [allStudents, scopeStudents]);
  const teachers = StorageService.getTeachers();
  const classes = useMemo(
    () => (isScoped && staffId ? StorageService.getClasses().filter((c) => c.teacherId === staffId) : StorageService.getClasses()),
    [isScoped, staffId, refreshKey]
  );

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [shuttleFilter, setShuttleFilter] = useState<'ALL' | 'SHUTTLE'>('ALL');
  const [sortBy, setSortBy] = useState<'joinDateDesc' | 'joinDateAsc' | 'name' | 'paymentDay'>('joinDateDesc');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  // 강사는 담당 필터 고정
  useEffect(() => {
    if (isScoped && staffId) {
      setTeacherFilter(staffId);
    }
  }, [isScoped, staffId]);

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
        if (teacherFilter !== 'ALL' && s.teacherId !== teacherFilter) {
          return false;
        }

        if (classFilter !== 'ALL' && !s.classIds.includes(classFilter)) {
          return false;
        }

        if (statusFilter !== 'ALL' && s.status !== statusFilter) {
          return false;
        }

        if (shuttleFilter === 'SHUTTLE' && !studentUsesShuttleService(s)) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = s.name.toLowerCase().includes(q);
          const matchPhone =
            studentMatchesGuardianQuery(s.id, searchQuery) ||
            (s.emergencyContact && s.emergencyContact.includes(q));
          const matchSchool = s.school.toLowerCase().includes(q);
          const matchParent = studentMatchesGuardianQuery(s.id, searchQuery);
          const matchNum = s.studentNumber.toLowerCase().includes(q);
          const matchPickup = (s.pickupAddresses || []).some(
            (a) =>
              a.label.toLowerCase().includes(q) ||
              a.address.toLowerCase().includes(q) ||
              (a.detail || '').toLowerCase().includes(q)
          );
          if (!matchName && !matchPhone && !matchSchool && !matchParent && !matchNum && !matchPickup) {
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
  }, [students, searchQuery, teacherFilter, classFilter, statusFilter, shuttleFilter, sortBy]);

  const activeCount = students.filter((s) => s.status === 'active').length;
  const leaveCount = students.filter((s) => s.status === 'leave').length;
  const withdrawnCount = students.filter((s) => s.status === 'withdrawn').length;
  const shuttleCount = students.filter((s) => studentUsesShuttleService(s)).length;

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
      <PageHeader
        icon={<Users className="w-6 h-6" />}
        title={labels.customer.management}
        description="원생 등록·수정, 학부모 연결, 수강료·출결 정보를 관리합니다"
        actions={
          !isScoped ? (
            <button
              onClick={() => {
                setEditingStudent(null);
                setIsFormModalOpen(true);
              }}
              className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {labels.customer.add}
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryMetricCard label="재원" value={`${activeCount}명`} variant="emerald" />
        <SummaryMetricCard label="휴원" value={`${leaveCount}명`} variant="amber" />
        <SummaryMetricCard label="퇴원" value={`${withdrawnCount}명`} variant="default" />
        <SummaryMetricCard label="전체" value={`${students.length}명`} variant="indigo" />
      </div>

      <FilterBar className="flex-col items-stretch gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          <SearchField
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="이름, 학부모 연락처, 학교, 번호 검색..."
            className="lg:col-span-2"
          />
          {!isScoped && (
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              <option value="ALL">선생님 전체</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          >
            <option value="ALL">수업반 전체</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
          >
            <option value="ALL">상태 전체 ({students.length})</option>
            <option value="active">재원 ({activeCount})</option>
            <option value="leave">휴원 ({leaveCount})</option>
            <option value="withdrawn">퇴원 ({withdrawnCount})</option>
          </select>

          {showPickupFields && (
            <select
              value={shuttleFilter}
              onChange={(e) => setShuttleFilter(e.target.value as 'ALL' | 'SHUTTLE')}
              className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
            >
              <option value="ALL">셔틀 전체</option>
              <option value="SHUTTLE">셔틀 이용 ({shuttleCount})</option>
            </select>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 w-full">
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
      </FilterBar>

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
                    <th className="py-3.5 px-4">수강료 / 수납일</th>
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
                            {showPickupFields && studentUsesShuttleService(st) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold inline-flex items-center gap-0.5">
                                <Bus className="w-3 h-3" />
                                셔틀
                              </span>
                            )}
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
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{formatCurrency(st.tuitionFee)}</span>
                          <span className="text-slate-400 text-[11px] ml-1">/ 매월 {st.paymentDay}일</span>
                        </td>
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                          <span className="text-[10px] text-slate-400">({st.gender === 'F' ? '여' : '남'})</span>
                          {showPickupFields && studentUsesShuttleService(st) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold inline-flex items-center gap-0.5">
                              <Bus className="w-3 h-3" />
                              셔틀
                            </span>
                          )}
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
                    <span className="font-bold text-slate-800">
                      {formatCurrency(st.tuitionFee)}
                    </span>
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
        initialTab={selectedStudentDetailTab || undefined}
        onInitialTabApplied={() => setSelectedStudentDetailTab(null)}
      />
    </div>
  );
};
