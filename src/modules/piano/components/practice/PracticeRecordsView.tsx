import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { PracticeRecord } from '@/types';
import {
  BookOpenCheck,
  Plus,
  Search,
  Filter,
  Clock,
  User,
  Star,
  Award,
  Sparkles,
  Trash2,
  X,
  Save
} from 'lucide-react';

export const PracticeRecordsView: React.FC = () => {
  const { showToast, openConfirmDialog, setSelectedStudentId, setActiveTab } = useApp();

  const practiceList = StorageService.getPracticeRecords();
  const students = StorageService.getStudents();

  const [studentFilter, setStudentFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: students[0]?.id || '',
    date: new Date().toISOString().slice(0, 10),
    minutes: 40,
    songTitle: '',
    difficultyPart: '',
    homework: '',
    teacherEvaluation: '⭐⭐⭐⭐'
  });

  const filteredPractice = useMemo(() => {
    return practiceList.filter((p) => {
      if (studentFilter !== 'ALL' && p.studentId !== studentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!p.studentName.toLowerCase().includes(q) && !p.songTitle.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [practiceList, studentFilter, searchQuery]);

  const totalMinutes = filteredPractice.reduce((sum, p) => sum + p.minutes, 0);

  const handleOpenCreate = () => {
    setFormData({
      studentId: students[0]?.id || '',
      date: new Date().toISOString().slice(0, 10),
      minutes: 45,
      songTitle: '체르니 100번 30번 & 소나티네 Op.36 No.1',
      difficultyPart: '1악장 발전부 왼손 도약',
      homework: '왼손 독립 연습 하루 3번',
      teacherEvaluation: '⭐⭐⭐⭐⭐'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (p: PracticeRecord) => {
    openConfirmDialog({
      title: '연습 기록 삭제',
      message: `${p.studentName}의 ${p.date} 연습 기록을 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제하기',
      onConfirm: () => {
        StorageService.deletePracticeRecord(p.id);
        showToast('연습 기록이 삭제되었습니다.', 'info');
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const st = students.find((s) => s.id === formData.studentId);
    if (!st) {
      showToast('원생을 선택해주세요.', 'warning');
      return;
    }
    if (!formData.songTitle.trim()) {
      showToast('연습 곡명을 입력해주세요.', 'warning');
      return;
    }

    StorageService.savePracticeRecord({
      studentId: st.id,
      studentName: st.name,
      date: formData.date,
      minutes: Number(formData.minutes) || 30,
      songTitle: formData.songTitle.trim(),
      difficultyPart: formData.difficultyPart.trim(),
      homework: formData.homework.trim(),
      teacherEvaluation: formData.teacherEvaluation
    });

    showToast('연습 기록이 등록되었습니다.', 'success');
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpenCheck className="w-6 h-6 text-indigo-600" />
            원생 연습 기록
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            원생별 일일 연습 시간, 연습곡, 피드백 평가
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          연습 기록 추가
        </button>
      </div>

      {/* Summary card & Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">총 누적 연습 시간</p>
          <p className="text-2xl font-black text-slate-900 mt-1">
            {totalMinutes}분 <span className="text-sm font-normal text-slate-500">({(totalMinutes / 60).toFixed(1)}시간)</span>
          </p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">기록된 연습 일지</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">
            {filteredPractice.length}건
          </p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-medium">평균 연습 시간</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {filteredPractice.length > 0 ? Math.round(totalMinutes / filteredPractice.length) : 0}분
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
          >
            <option value="ALL">전체 원생</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.school})
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="원생, 연습곡명 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Practice List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPractice.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => {
                      setSelectedStudentId(p.studentId);
                      setActiveTab('students');
                    }}
                    className="font-bold text-sm text-slate-900 hover:text-indigo-600 cursor-pointer"
                  >
                    {p.studentName}
                  </span>
                  <span className="text-xs font-mono text-slate-400 font-medium">{p.date}</span>
                </div>

                <button
                  onClick={() => handleDelete(p)}
                  className="p-1 text-slate-300 hover:text-rose-600 rounded-lg"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="mt-2 flex items-center justify-between bg-indigo-50/60 p-2.5 rounded-xl text-xs">
                <span className="font-bold text-indigo-900">⏱️ {p.minutes}분 연습</span>
                <span className="text-amber-500">{p.teacherEvaluation}</span>
              </div>

              <div className="mt-3 text-xs space-y-1.5 text-slate-700">
                <p className="font-bold text-slate-900">🎶 {p.songTitle}</p>
                {p.difficultyPart && (
                  <p className="text-slate-600 text-[11px]">
                    <strong>포인트:</strong> {p.difficultyPart}
                  </p>
                )}
                {p.homework && (
                  <p className="text-purple-700 text-[11px] font-medium bg-purple-50 p-1.5 rounded-lg">
                    📝 숙제: {p.homework}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">원생 연습 기록 등록</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">원생 선택</label>
                  <select
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">연습 일자</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">연습 시간 (분)</label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    max="300"
                    required
                    value={formData.minutes}
                    onChange={(e) => setFormData({ ...formData, minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">선생님 평가</label>
                  <select
                    value={formData.teacherEvaluation}
                    onChange={(e) => setFormData({ ...formData, teacherEvaluation: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="⭐⭐⭐⭐⭐">⭐⭐⭐⭐⭐ (최고예요)</option>
                    <option value="⭐⭐⭐⭐">⭐⭐⭐⭐ (아주 잘함)</option>
                    <option value="⭐⭐⭐">⭐⭐⭐ (보통)</option>
                    <option value="⭐⭐">⭐⭐ (분발 필요)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  연습 곡 / 교재 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 하농 1번, 체르니 100번 25번"
                  value={formData.songTitle}
                  onChange={(e) => setFormData({ ...formData, songTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">어려운 부분 / 집중 지도 포인트</label>
                <input
                  type="text"
                  placeholder="예: 왼손 도약 리듬 집중"
                  value={formData.difficultyPart}
                  onChange={(e) => setFormData({ ...formData, difficultyPart: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">과제 / 숙제</label>
                <input
                  type="text"
                  placeholder="예: 양손 3회씩 메트로놈에 맞춰 연습"
                  value={formData.homework}
                  onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
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
