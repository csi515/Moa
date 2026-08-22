import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageService } from '../../services/storage';
import { Student } from '../../types';
import { formatPhone, getLevelColor } from '../../utils/formatters';
import {
  UserSquare2,
  Search,
  Phone,
  MessageCircle,
  Users,
  Send,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface ParentGroup {
  parentPhone: string;
  parentName: string;
  emergencyContact?: string;
  address?: string;
  students: Student[];
}

export const ParentManagementView: React.FC = () => {
  const { showToast, setSelectedStudentId, setActiveTab } = useApp();
  const students = StorageService.getStudents();

  const [searchQuery, setSearchQuery] = useState('');
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentGroup | null>(null);
  const [smsMessage, setSmsMessage] = useState('');

  // Group students by parentPhone
  const parentGroups: ParentGroup[] = React.useMemo(() => {
    const map = new Map<string, ParentGroup>();
    students.forEach((s) => {
      const key = s.parentPhone.trim();
      if (!map.has(key)) {
        map.set(key, {
          parentPhone: s.parentPhone,
          parentName: s.parentName,
          emergencyContact: s.emergencyContact,
          address: s.address,
          students: []
        });
      }
      map.get(key)!.students.push(s);
    });
    return Array.from(map.values());
  }, [students]);

  const filteredParents = parentGroups.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchParent = p.parentName.toLowerCase().includes(q);
    const matchPhone = p.parentPhone.includes(q);
    const matchStudent = p.students.some((st) => st.name.toLowerCase().includes(q));
    return matchParent || matchPhone || matchStudent;
  });

  const handleOpenSmsModal = (parent: ParentGroup) => {
    setSelectedParent(parent);
    setSmsMessage(`[맑은소리 피아노학원] 안녕하세요, ${parent.parentName} 학부모님.\n`);
    setSmsModalOpen(true);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParent || !smsMessage.trim()) return;

    StorageService.saveNotification({
      type: 'notice',
      title: `${selectedParent.parentName} 학부모님 개별 알림`,
      message: smsMessage,
      targetGroup: `${selectedParent.parentName} 학부모`,
      recipientCount: 1,
      targetParentPhone: selectedParent.parentPhone,
      status: 'sent',
      sentAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });

    showToast(`${selectedParent.parentName} 학부모님께 문자 알림이 전송되었습니다.`, 'success');
    setSmsModalOpen(false);
    setSelectedParent(null);
  };

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserSquare2 className="w-6 h-6 text-indigo-600" />
            학부모 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            등록된 학부모 <strong className="text-indigo-600 font-bold">{parentGroups.length}명</strong> (다자녀 가정 포함)
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="학부모 성함, 연락처, 자녀(원생) 이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Parents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParents.map((parent, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                    {parent.parentName.slice(0, 1) || '학'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{parent.parentName}</h4>
                    <p className="font-mono text-xs text-indigo-600 font-semibold mt-0.5">
                      {formatPhone(parent.parentPhone)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${parent.parentPhone}`}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                    title="전화 걸기"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleOpenSmsModal(parent)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 transition-colors cursor-pointer"
                    title="문자 발송"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {parent.address && (
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">📍 {parent.address}</p>
              )}

              {/* Children List */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  자녀 원생 ({parent.students.length}명)
                </p>
                <div className="space-y-1.5">
                  {parent.students.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleStudentClick(st.id)}
                      className="w-full p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 transition-colors flex items-center justify-between text-xs text-left cursor-pointer"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{st.name}</span>
                        <span className="text-[11px] text-slate-500 ml-1.5">
                          {st.school} {st.grade}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${getLevelColor(st.level)}`}>
                        {st.level}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SMS Modal */}
      {smsModalOpen && selectedParent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {selectedParent.parentName} 학부모님께 문자 알림 발송
              </h3>
              <button
                onClick={() => setSmsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSendSms} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  수신자: {selectedParent.parentName} ({selectedParent.parentPhone})
                </label>
                <textarea
                  rows={4}
                  required
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSmsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  문자 발송
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
