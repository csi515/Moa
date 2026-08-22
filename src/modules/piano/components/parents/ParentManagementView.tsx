import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { StorageService } from '@/services/storage';
import { Student } from '@/types';
import { formatPhone, getLevelColor } from '@/utils/formatters';
import {
  UserSquare2,
  Search,
  Phone,
  Users,
} from 'lucide-react';

interface ParentGroup {
  parentPhone: string;
  parentName: string;
  emergencyContact?: string;
  address?: string;
  students: Student[];
}

export const ParentManagementView: React.FC = () => {
  const { setSelectedStudentId, setActiveTab } = useApp();
  const students = StorageService.getStudents();

  const [searchQuery, setSearchQuery] = useState('');

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

  const handleStudentClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setActiveTab('students');
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserSquare2 className="w-6 h-6 text-indigo-600" />
            학부모 관리
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            학부모 연락처 및 자녀 원생 정보를 한눈에 확인합니다
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="학부모 이름, 연락처, 원생 이름 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredParents.map((parent) => (
          <div
            key={parent.parentPhone}
            className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all"
          >
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

              <a
                href={`tel:${parent.parentPhone}`}
                className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                title="전화 걸기"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            {parent.address && (
              <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">📍 {parent.address}</p>
            )}

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
        ))}
      </div>

      {filteredParents.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-500">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-600">등록된 학부모 정보가 없습니다</p>
        </div>
      )}
    </div>
  );
};
