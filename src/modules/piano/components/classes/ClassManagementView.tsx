import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import { PageHeader } from '@/shared/components';
import { ClassItem, DayOfWeek } from '@/types';
import {
  GraduationCap,
  Plus,
  Clock,
  Users,
  Edit,
  Trash2,
  X,
  Save,
  BookOpen,
  CalendarDays
} from 'lucide-react';

const DAYS_OF_WEEK: DayOfWeek[] = ['월', '화', '수', '목', '금', '토'];

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function formatTime(totalMinutes: number): string {
  const mins = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function durationBetween(start: string, end: string): number {
  return Math.max(5, parseMinutes(end) - parseMinutes(start));
}

export const ClassManagementView: React.FC = () => {
  const { showToast, openConfirmDialog, setSelectedStudentId, setActiveTab } = useApp();
  const { industry } = usePermissions();
  const isAcademy = industry === 'academy';

  const classes = StorageService.getClasses();
  const teachers = StorageService.getTeachers();
  const students = StorageService.getStudents();
  const defaultDuration = StorageService.getSettings().defaultLessonMinutes || (isAcademy ? 60 : 50);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    targetLevel: isAcademy ? '국어' : '바이엘 하',
    daysOfWeek: ['월', '수', '금'] as DayOfWeek[],
    startTime: '15:00',
    endTime: formatTime(parseMinutes('15:00') + defaultDuration),
    durationMinutes: defaultDuration,
    capacity: isAcademy ? 8 : 4,
    teacherId: teachers[0]?.id || '',
    room: isAcademy ? '1강의실' : '피아노 1실',
    color: '#4f46e5',
    textbook: '',
    memo: ''
  });

  const handleOpenCreate = () => {
    setEditingClass(null);
    const start = '15:00';
    setFormData({
      name: '',
      targetLevel: isAcademy ? '수학' : '바이엘 하',
      daysOfWeek: ['월', '수', '금'],
      startTime: start,
      endTime: formatTime(parseMinutes(start) + defaultDuration),
      durationMinutes: defaultDuration,
      capacity: isAcademy ? 8 : 4,
      teacherId: teachers[0]?.id || '',
      room: isAcademy ? '1강의실' : '피아노 1실',
      color: '#4f46e5',
      textbook: '',
      memo: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassItem) => {
    setEditingClass(cls);
    const duration = durationBetween(cls.startTime, cls.endTime);
    setFormData({
      name: cls.name,
      targetLevel: cls.targetLevel || cls.level || (isAcademy ? '국어' : '바이엘 하'),
      daysOfWeek: cls.daysOfWeek,
      startTime: cls.startTime,
      endTime: cls.endTime,
      durationMinutes: duration,
      capacity: cls.capacity,
      teacherId: cls.teacherId,
      room: cls.room,
      color: cls.color || '#4f46e5',
      textbook: cls.textbook || '',
      memo: cls.memo || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = (cls: ClassItem) => {
    openConfirmDialog({
      title: '반/수업 삭제',
      message: `'${cls.name}' 수업을 삭제하시겠습니까?\n배정된 원생 정보는 유지되지만 시간표에서 제외됩니다.`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deleteClass(cls.id);
        showToast(`'${cls.name}' 수업이 삭제되었습니다.`, 'info');
      }
    });
  };

  const handleDayToggle = (day: DayOfWeek) => {
    setFormData((prev) => {
      const exists = prev.daysOfWeek.includes(day);
      return {
        ...prev,
        daysOfWeek: exists
          ? prev.daysOfWeek.filter((d) => d !== day)
          : [...prev.daysOfWeek, day]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('반 이름을 입력해주세요.', 'warning');
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      showToast('최소 1개 이상의 요일을 선택해주세요.', 'warning');
      return;
    }

    const targetTeacher = teachers.find((t) => t.id === formData.teacherId);
    const endTime = formatTime(parseMinutes(formData.startTime) + formData.durationMinutes);
    StorageService.saveClass({
      ...(editingClass ? { id: editingClass.id } : {}),
      name: formData.name.trim(),
      targetLevel: formData.targetLevel,
      level: formData.targetLevel,
      daysOfWeek: formData.daysOfWeek,
      startTime: formData.startTime,
      endTime,
      capacity: Number(formData.capacity) || 4,
      teacherId: formData.teacherId,
      teacherName: targetTeacher ? targetTeacher.name : '미지정',
      room: formData.room,
      color: formData.color,
      textbook: formData.textbook.trim(),
      memo: formData.memo.trim()
    } as any);

    showToast(
      editingClass ? `'${formData.name}' 수업이 수정되었습니다.` : `'${formData.name}' 수업이 개설되었습니다.`,
      'success'
    );
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<GraduationCap className="w-6 h-6" />}
        title="반 / 수업 관리"
        description={
          isAcademy
            ? `국어·수학·영어 등 개설 반 ${classes.length}개 · 요일·시작 시각·수업 시간(분)`
            : `개설된 정규 및 특별 클래스 ${classes.length}개`
        }
        actions={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            신규 반 개설
          </button>
        }
      />

      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {classes.map((cls) => {
          const enrolled = students.filter((s) => s.status === 'active' && s.classIds?.includes(cls.id));
          const percent = Math.min(100, Math.round((enrolled.length / cls.capacity) * 100));

          return (
            <div
              key={cls.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-2xs"
                      style={{ backgroundColor: cls.color || '#4f46e5' }}
                    />
                    <h3 className="font-bold text-base text-slate-900">{cls.name}</h3>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {cls.room}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>요일: <strong>{cls.daysOfWeek.join(', ')}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      시간: {cls.startTime} ~ {cls.endTime}
                      <strong className="ml-1 text-indigo-700">
                        ({durationBetween(cls.startTime, cls.endTime)}분)
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>담당: <strong>{cls.teacherName}</strong></span>
                  </div>
                  {cls.textbook && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>교재: {cls.textbook}</span>
                    </div>
                  )}
                </div>

                {/* Capacity progress bar */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">수강 원생 현황</span>
                    <span className="font-bold text-slate-800">
                      {enrolled.length} / {cls.capacity}명 ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent >= 100 ? 'bg-rose-500' : percent >= 75 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Enrolled students chips */}
                {enrolled.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {enrolled.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => {
                          setSelectedStudentId(st.id);
                          setActiveTab('students');
                        }}
                        className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-100 text-slate-700 hover:text-indigo-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {st.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" /> 수정
                </button>
                <button
                  onClick={() => handleDelete(cls)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Class Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingClass ? '수업 반 수정' : '신규 반 개설'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  반 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isAcademy ? '예: 중1 수학 심화 (월/수/금)' : '예: 기초 피아노 A반 (월/수/금)'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  수업 요일 선택 <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {DAYS_OF_WEEK.map((d) => {
                    const isChecked = formData.daysOfWeek.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        onClick={() => handleDayToggle(d)}
                        className={`py-2.5 min-h-[44px] text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d}요일
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">시작 시간</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => {
                      const startTime = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        startTime,
                        endTime: formatTime(parseMinutes(startTime) + prev.durationMinutes),
                      }));
                    }}
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">수업 시간(분)</label>
                  <input
                    type="number"
                    min={10}
                    max={300}
                    step={5}
                    required
                    value={formData.durationMinutes}
                    onChange={(e) => {
                      const durationMinutes = Math.max(10, Number(e.target.value) || defaultDuration);
                      setFormData((prev) => ({
                        ...prev,
                        durationMinutes,
                        endTime: formatTime(parseMinutes(prev.startTime) + durationMinutes),
                      }));
                    }}
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">종료 시간</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => {
                      const endTime = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        endTime,
                        durationMinutes: durationBetween(prev.startTime, endTime),
                      }));
                    }}
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAcademy ? '과목 / 과정' : '과정 레벨'}
                </label>
                {isAcademy ? (
                  <select
                    value={formData.targetLevel}
                    onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {['국어', '수학', '영어', '과학', '사회', '논술', '종합', '기타'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.targetLevel}
                    onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder="예: 체르니 30"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">담당 선생님</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">강의실</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    placeholder={isAcademy ? '예: 2강의실' : '예: 피아노 1실'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">최대 정원 (명)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">구분 색상</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {isAcademy ? '교재 / 학습 자료' : '사용 교재'}
                </label>
                <input
                  type="text"
                  placeholder={isAcademy ? '예: 개념원리 수학, 모의고사 문제집' : '예: 바이엘 상권, 어린이 피아노 소곡집'}
                  value={formData.textbook}
                  onChange={(e) => setFormData({ ...formData, textbook: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">수업 메모</label>
                <textarea
                  rows={2}
                  placeholder="수업 특성 및 유의사항..."
                  value={formData.memo}
                  onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingClass ? '수정 내용 저장' : '수업 개설 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
