import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useModuleLabels } from '@/modules/piano';
import { StorageService } from '@/services/storage';
import { Teacher } from '@/types';
import {
  GraduationCap,
  Plus,
  Trash2,
  Edit,
  Phone,
  Mail,
  Calendar,
  Users,
  Award,
  X,
  Save
} from 'lucide-react';

export const TeacherManagementView: React.FC = () => {
  const { showToast, openConfirmDialog, currentUser } = useApp();
  const labels = useModuleLabels();
  const isDirector = currentUser.role === 'director';

  const teachers = StorageService.getTeachers();
  const classes = StorageService.getClasses();
  const students = StorageService.getStudents();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    hireDate: new Date().toISOString().slice(0, 10),
    specialty: '클래식 피아노, 기초 테크닉',
    status: 'active' as 'active' | 'inactive',
    color: '#4f46e5'
  });

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      phone: '010-0000-0000',
      email: '',
      hireDate: new Date().toISOString().slice(0, 10),
      specialty: '유아 피아노, 반주법, 콩쿠르 지도',
      status: 'active',
      color: '#8b5cf6'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      name: t.name,
      phone: t.phone,
      email: t.email || '',
      hireDate: t.hireDate,
      specialty: t.specialty,
      status: t.status,
      color: t.color || '#4f46e5'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (t: Teacher) => {
    openConfirmDialog({
      title: '강사 정보 삭제',
      message: `'${t.name}' 선생님 정보를 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deleteTeacher(t.id);
        showToast('선생님 정보가 삭제되었습니다.', 'info');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    StorageService.saveTeacher({
      ...(editingTeacher ? { id: editingTeacher.id } : {}),
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      hireDate: formData.hireDate,
      specialty: formData.specialty.trim(),
      status: formData.status,
      color: formData.color
    } as any);

    showToast(
      editingTeacher ? '강사 정보가 수정되었습니다.' : '신규 강사가 등록되었습니다.',
      'success'
    );
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-600" />
            {labels.staff.management}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            학원 전임 및 파트타임 강사 명단, 담당 클래스 배정
          </p>
        </div>

        {isDirector && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            신규 강사 등록
          </button>
        )}
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teachers.map((t) => {
          const teacherClasses = classes.filter((c) => c.teacherId === t.id);
          const teacherStudents = students.filter((s) => s.status === 'active' && s.teacherId === t.id);

          return (
            <div
              key={t.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl text-white font-black text-lg flex items-center justify-center shadow-xs"
                      style={{ backgroundColor: t.color || '#4f46e5' }}
                    >
                      {t.name.slice(0, 1)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                        {t.name}
                        {t.status === 'active' ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        ) : (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                            휴직
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{t.specialty}</p>
                    </div>
                  </div>

                  {isDirector && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{t.phone}</span>
                  </div>
                  {t.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>입사일: {t.hireDate}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">담당 원생</span>
                    <strong className="text-indigo-600">{teacherStudents.length}명</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">개설 클래스</span>
                    <strong className="text-slate-800">{teacherClasses.length}개 반</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Teacher Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                {editingTeacher ? '강사 정보 수정' : '신규 강사 등록'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  선생님 성명 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김선경"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">연락처</label>
                  <input
                    type="tel"
                    required
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">입사일자</label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">이메일</label>
                <input
                  type="email"
                  placeholder="teacher@pianoacademy.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">전공 및 전문 분야</label>
                <input
                  type="text"
                  placeholder="예: 피아노과 학사 / 반주법, 유아 음악 전문"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">대표 색상</label>
                <div className="flex gap-2">
                  {['#4f46e5', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-7 h-7 rounded-xl border-2 transition-transform cursor-pointer ${
                        formData.color === c ? 'scale-110 border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
