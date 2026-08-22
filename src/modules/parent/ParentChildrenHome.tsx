import React from 'react';
import { ChevronRight, Users, Building2 } from 'lucide-react';
import { useParentPortal } from '@/core/parent/context/ParentPortalContext';
import { GUARDIAN_RELATIONSHIP_LABELS } from '@/core/parent/types';
import type { GlobalStudent } from '@/core/parent/types/globalParent';

export const ParentChildrenHome: React.FC = () => {
  const { portalTree, selectStudent } = useParentPortal();
  const children = portalTree?.children ?? [];

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
        <Users className="w-10 h-10 mx-auto text-slate-300 mb-3" />
        <p className="font-bold text-slate-700">연결된 자녀가 없습니다</p>
        <p className="text-sm mt-2">학원에 보호자 연결을 요청해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">내 자녀</p>
      {children.map((child) => (
        <ChildCard key={child.studentId} child={child} onSelect={() => selectStudent(child)} />
      ))}
    </div>
  );
};

const ChildCard: React.FC<{ child: GlobalStudent; onSelect: () => void }> = ({ child, onSelect }) => {
  const academyCount = child.enrollments.length;
  const activeCount = child.enrollments.filter((e) => e.status === 'active' || e.status === 'leave').length;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors text-left min-h-[44px]"
    >
      <div className="min-w-0">
        <p className="font-black text-slate-900 truncate">{child.displayName}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {GUARDIAN_RELATIONSHIP_LABELS[child.relationship]}
          {child.isPrimary && ' · 대표 보호자'}
        </p>
        <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
          <Building2 className="w-3 h-3" />
          {academyCount > 0 ? `학원 ${activeCount}/${academyCount}` : '등록 학원 없음'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
    </button>
  );
}
