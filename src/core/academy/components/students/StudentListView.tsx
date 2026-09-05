import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { getIndustryPlugin } from '@/core/industry/registry';
import { useModuleLabels } from '@/core/labels';
import { studentUsesShuttleService } from '@/core/transport';
import { useStaffScope } from '@/hooks';
import { getPrimaryGuardian, studentMatchesGuardianQuery } from '@/core/parent/guardianHelpers';
import { StorageService } from '@/services/storage';
import { Student } from '@/types';
import { StudentFormModal } from './StudentFormModal';
import { StudentDetailModal } from './StudentDetailModal';
import {
  formatPhone,
  getStudentStatusBadge,
} from '@/utils/formatters';
import { PageHeader, FilterBar, SearchField, EmptyState } from '@/shared/components';
import {
  Users,
  UserPlus,
  Phone,
  ArrowUpDown,
  ChevronRight,
  Bus,
  SlidersHorizontal,
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
  const classNameById = useMemo(() => {
    const map = new Map<string, string>();
    classes.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [classes]);

  const [searchQuery, setSearchQuery] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [shuttleFilter, setShuttleFilter] = useState<'ALL' | 'SHUTTLE'>('ALL');
  const [sortBy, setSortBy] = useState<'joinDateDesc' | 'joinDateAsc' | 'name' | 'paymentDay'>('joinDateDesc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (isScoped && staffId) {
      setTeacherFilter(staffId);
    }
  }, [isScoped, staffId]);

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

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    teacherFilter !== 'ALL' ||
    classFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    shuttleFilter !== 'ALL';

  const advancedFilterCount = [
    !isScoped && teacherFilter !== 'ALL',
    classFilter !== 'ALL',
    shuttleFilter !== 'ALL',
    sortBy !== 'joinDateDesc',
  ].filter(Boolean).length;

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

  const getClassLabel = (student: Student) => {
    if (!student.classIds?.length) return '미배정';
    const names = student.classIds
      .map((id) => classNameById.get(id))
      .filter(Boolean) as string[];
    if (names.length === 0) return `${student.classIds.length}개 레슨`;
    if (names.length === 1) return names[0];
    return `${names[0]} 외 ${names.length - 1}`;
  };

  const getGuardianLabel = (student: Student) => {
    const primary = getPrimaryGuardian(student.id);
    if (primary) {
      return {
        name: primary.parentName,
        phone: primary.parentPhone,
      };
    }
    return {
      name: student.parentName || '-',
      phone: student.parentPhone || '',
    };
  };

  const statusChips: Array<{ value: string; label: string; count: number }> = [
    { value: 'ALL', label: '전체', count: students.length },
    { value: 'active', label: '재원', count: activeCount },
    { value: 'leave', label: '휴원', count: leaveCount },
    { value: 'withdrawn', label: '퇴원', count: withdrawnCount },
  ];

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        density="compact"
        icon={<Users className="w-5 h-5" />}
        title={labels.customer.management}
        description={`${labels.customer.singular} 등록·검색·수업·출결·수납`}
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

      <FilterBar className="flex-col items-stretch gap-3">
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={labels.customer.search || '이름, 보호자, 학교, 번호 검색...'}
          className="w-full"
        />

        <div className="flex flex-wrap items-center gap-2">
          {statusChips.map((chip) => {
            const isActive = statusFilter === chip.value;
            return (
              <button
                key={chip.value}
                type="button"
                onClick={() => setStatusFilter(chip.value)}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {chip.label} {chip.count}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            className={`min-h-[36px] ml-auto px-3 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
              showAdvancedFilters || advancedFilterCount > 0
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            aria-expanded={showAdvancedFilters}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            필터
            {advancedFilterCount > 0 && (
              <span className="bg-white/20 px-1.5 rounded-md">{advancedFilterCount}</span>
            )}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
            {!isScoped && (
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="ALL">{labels.staff.singular} 전체</option>
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
              <option value="ALL">레슨 전체</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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

            <div className="flex items-center gap-1.5 px-3 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-transparent w-full font-semibold focus:outline-none cursor-pointer"
              >
                <option value="joinDateDesc">등록일 최신순</option>
                <option value="joinDateAsc">등록일 과거순</option>
                <option value="name">이름 가나다순</option>
                <option value="paymentDay">수납일순</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-500 w-full">
          <span>
            검색된 {labels.customer.singular}:{' '}
            <strong className="text-slate-800">{filteredStudents.length}명</strong>
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setTeacherFilter(isScoped && staffId ? staffId : 'ALL');
                setClassFilter('ALL');
                setStatusFilter('ALL');
                setShuttleFilter('ALL');
              }}
              className="font-bold text-indigo-600 hover:text-indigo-700"
            >
              초기화
            </button>
          )}
        </div>
      </FilterBar>

      {filteredStudents.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title={
            hasActiveFilters
              ? `조건에 일치하는 ${labels.customer.singular}이 없습니다`
              : `등록된 ${labels.customer.singular}이 없습니다`
          }
          description={
            hasActiveFilters
              ? '검색어나 필터를 변경해보세요.'
              : `상단 '${labels.customer.add}' 버튼으로 첫 번째 ${labels.customer.singular}을 등록해보세요.`
          }
          action={
            hasActiveFilters ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTeacherFilter(isScoped && staffId ? staffId : 'ALL');
                  setClassFilter('ALL');
                  setStatusFilter('ALL');
                  setShuttleFilter('ALL');
                }}
                className="px-4 py-2.5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-all"
              >
                필터 초기화
              </button>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">이름</th>
                    <th className="py-2.5 px-3">레슨</th>
                    <th className="py-2.5 px-3">보호자</th>
                    <th className="py-2.5 px-3">상태</th>
                    <th className="py-2.5 px-3 text-right">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st) => {
                    const badge = getStudentStatusBadge(st.status);
                    const guardian = getGuardianLabel(st);
                    return (
                      <tr
                        key={st.id}
                        onClick={() => handleOpenDetail(st)}
                        className="hover:bg-indigo-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shadow-2xs"
                              style={{ backgroundColor: st.avatarColor || '#4f46e5' }}
                            >
                              {st.name.slice(0, 1)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {st.name}
                                </span>
                                {showPickupFields && studentUsesShuttleService(st) && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold inline-flex items-center gap-0.5">
                                    <Bus className="w-3 h-3" />
                                    셔틀
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono">{st.studentNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 font-medium">
                          {getClassLabel(st)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {guardian.phone ? (
                              <a
                                href={`tel:${guardian.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-indigo-600 hover:underline font-semibold font-mono"
                              >
                                {formatPhone(guardian.phone)}
                              </a>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                            <span className="text-slate-400 text-[10px] truncate">({guardian.name})</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(st);
                            }}
                            className="p-1.5 text-slate-400 group-hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
                            aria-label="상세 보기"
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

          <div className="md:hidden space-y-2">
            {filteredStudents.map((st) => {
              const badge = getStudentStatusBadge(st.status);
              const guardian = getGuardianLabel(st);
              return (
                <div
                  key={st.id}
                  onClick={() => handleOpenDetail(st)}
                  className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs active:bg-slate-50 transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl text-white font-extrabold text-sm flex items-center justify-center shadow-xs shrink-0"
                        style={{ backgroundColor: st.avatarColor || '#4f46e5' }}
                      >
                        {st.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm text-slate-900">{st.name}</h4>
                          {showPickupFields && studentUsesShuttleService(st) && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold inline-flex items-center gap-0.5">
                              <Bus className="w-3 h-3" />
                              셔틀
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{getClassLabel(st)}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-slate-600 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {guardian.phone ? (
                        <a
                          href={`tel:${guardian.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 font-semibold font-mono"
                        >
                          {formatPhone(guardian.phone)}
                        </a>
                      ) : (
                        <span className="text-slate-400">연락처 없음</span>
                      )}
                      <span className="text-slate-400 truncate">· {guardian.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

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
