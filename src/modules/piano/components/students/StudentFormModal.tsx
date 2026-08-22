import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { Student, StudentLevel, StudentStatus } from '@/types';
import { X, Save, User, Phone, MapPin, School, BookOpen, Calendar, DollarSign } from 'lucide-react';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

interface StudentFormModalProps {
  student?: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (student: Student) => void;
}

const LEVEL_OPTIONS: StudentLevel[] = [
  '바이엘 상',
  '바이엘 하',
  '체르니 100',
  '체르니 30',
  '체르니 40',
  '체르니 50',
  '소나티네/명곡',
  '작품집/쇼팽',
  '입시/콩쿠르',
  '성인 취미'
];

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  student,
  isOpen,
  onClose,
  onSaved
}) => {
  const { showToast } = useApp();
  const teachers = StorageService.getTeachers();
  const classes = StorageService.getClasses();
  const settings = StorageService.getSettings();

  const [formData, setFormData] = useState({
    name: '',
    gender: 'F' as 'M' | 'F',
    birthDate: '2015-01-01',
    school: '',
    grade: '초3',
    parentName: '',
    parentPhone: '',
    emergencyContact: '',
    address: '',
    joinDate: new Date().toISOString().slice(0, 10),
    leaveDate: '',
    status: 'active' as StudentStatus,
    teacherId: teachers[0]?.id || '',
    classIds: [] as string[],
    level: '체르니 100' as StudentLevel,
    tuitionFee: settings.defaultTuitionFee || 180000,
    paymentDay: 10,
    specialNotes: '',
    memo: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        name: student.name || '',
        gender: student.gender || 'F',
        birthDate: student.birthDate || '2015-01-01',
        school: student.school || '',
        grade: student.grade || '초3',
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || '',
        emergencyContact: student.emergencyContact || '',
        address: student.address || '',
        joinDate: student.joinDate || new Date().toISOString().slice(0, 10),
        leaveDate: student.leaveDate || '',
        status: student.status || 'active',
        teacherId: student.teacherId || teachers[0]?.id || '',
        classIds: student.classIds || [],
        level: student.level || '체르니 100',
        tuitionFee: student.tuitionFee || 180000,
        paymentDay: student.paymentDay || 10,
        specialNotes: student.specialNotes || '',
        memo: student.memo || ''
      });
    } else {
      setFormData({
        name: '',
        gender: 'F',
        birthDate: '2015-01-01',
        school: '',
        grade: '초3',
        parentName: '',
        parentPhone: '',
        emergencyContact: '',
        address: '',
        joinDate: new Date().toISOString().slice(0, 10),
        leaveDate: '',
        status: 'active',
        teacherId: teachers[0]?.id || '',
        classIds: classes.length > 0 ? [classes[0].id] : [],
        level: '바이엘 상',
        tuitionFee: settings.defaultTuitionFee || 180000,
        paymentDay: 10,
        specialNotes: '',
        memo: ''
      });
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => {
      const exists = prev.classIds.includes(classId);
      return {
        ...prev,
        classIds: exists
          ? prev.classIds.filter((id) => id !== classId)
          : [...prev.classIds, classId]
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('원생 이름을 입력해주세요.', 'warning');
      return;
    }
    if (!formData.parentPhone.trim()) {
      showToast('학부모 연락처를 입력해주세요.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetTeacher = teachers.find((t) => t.id === formData.teacherId);
      const saved = StorageService.saveStudent({
        ...(student?.id ? { id: student.id, studentNumber: student.studentNumber } : {}),
        name: formData.name.trim(),
        gender: formData.gender,
        birthDate: formData.birthDate,
        school: formData.school.trim(),
        grade: formData.grade.trim(),
        parentName: formData.parentName.trim(),
        parentPhone: formData.parentPhone.trim(),
        emergencyContact: formData.emergencyContact.trim(),
        address: formData.address.trim(),
        joinDate: formData.joinDate,
        leaveDate: formData.leaveDate || undefined,
        status: formData.status,
        teacherId: formData.teacherId,
        teacherName: targetTeacher ? targetTeacher.name : '미지정',
        classIds: formData.classIds,
        level: formData.level,
        tuitionFee: Number(formData.tuitionFee) || 0,
        paymentDay: Number(formData.paymentDay) || 10,
        specialNotes: formData.specialNotes.trim(),
        memo: formData.memo.trim()
      } as any);

      showToast(
        student ? `${saved.name} 원생 정보가 수정되었습니다.` : `${saved.name} 원생이 등록되었습니다.`,
        'success'
      );
      onSaved(saved);
      onClose();
    } catch (err) {
      showToast('저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {student ? `${student.name} 원생 정보 수정` : '신규 원생 등록'}
              </h3>
              <p className="text-xs text-slate-500">피아노학원 원생 정보를 입력하세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: 기본 인적사항 */}
          <div>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> 기본 인적사항
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  원생 이름 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 김도윤"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">성별</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'F' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      formData.gender === 'F'
                        ? 'bg-pink-50 border-pink-300 text-pink-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    여학생
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: 'M' })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      formData.gender === 'M'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    남학생
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">생년월일</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">학교/기관명</label>
                <input
                  type="text"
                  placeholder="예: 반포초등학교"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">학년/구분</label>
                <input
                  type="text"
                  placeholder="예: 초3, 7세, 성인"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">재원 상태</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="active">재원</option>
                  <option value="leave">휴원</option>
                  <option value="withdrawn">퇴원</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: 학부모 및 연락처 */}
          <div>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> 학부모 및 연락처
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">학부모 이름</label>
                <input
                  type="text"
                  placeholder="예: 김은정 (모)"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  학부모 연락처 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010-0000-0000"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">비상 연락처</label>
                <input
                  type="tel"
                  placeholder="010-0000-0000 (부)"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">거주 주소</label>
                <input
                  type="text"
                  placeholder="예: 서울특별시 서초구 반포대로 123 래미안 101동"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: 교육 과정 및 수업 배정 */}
          <div>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> 교육 과정 및 수업 배정
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">피아노 레벨</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as StudentLevel })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                >
                  {LEVEL_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

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
                <label className="block text-xs font-semibold text-slate-700 mb-1">등록일 (입학일)</label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  수강 반 배정 (복수 선택 가능)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {classes.map((cls) => {
                    const isChecked = formData.classIds.includes(cls.id);
                    return (
                      <button
                        type="button"
                        key={cls.id}
                        onClick={() => handleClassToggle(cls.id)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div>
                          <p>{cls.name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {cls.daysOfWeek.join(', ')} | {cls.startTime}~{cls.endTime}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: 수강료 및 수납일 */}
          <div>
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" /> 수강료 및 수납 설정
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">월 수강료 (₩)</label>
                <CurrencyInput
                  value={formData.tuitionFee}
                  onChange={(val) => setFormData({ ...formData, tuitionFee: val })}
                  showQuickButtons
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">매월 정기 수납일</label>
                <select
                  value={formData.paymentDay}
                  onChange={(e) => setFormData({ ...formData, paymentDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {[1, 5, 10, 15, 20, 25, 28].map((day) => (
                    <option key={day} value={day}>
                      매월 {day}일
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: 특이사항 & 메모 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                특이사항 (손가락 유연성, 성향, 건강, 차량 등)
              </label>
              <input
                type="text"
                placeholder="예: 양손 악보 리딩 속도가 빠르고 칭찬 스티커에 동기부여가 잘 됨"
                value={formData.specialNotes}
                onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">선생님 / 원장 메모</label>
              <textarea
                rows={2}
                placeholder="학원 내부 공유용 메모..."
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? '저장 중...' : student ? '수정 내용 저장' : '원생 등록 완료'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
