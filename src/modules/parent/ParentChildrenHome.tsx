import React from 'react';
import { ChevronRight, Users, Building2 } from 'lucide-react';
import { useParentPortal } from '@/core/parent/context/ParentPortalContext';
import { GUARDIAN_RELATIONSHIP_LABELS } from '@/core/parent/types';
import { ACTIVE_ENROLLMENT_STATUSES, INACTIVE_ENROLLMENT_STATUSES, type GlobalStudent } from '@/core/parent/types/globalParent';

export const ParentChildrenHome: React.FC = () => {
  const { portalTree, selectStudent } = useParentPortal();
  const children = portalTree?.children ?? [];

  if (children.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-10 text-center border border-slate-200 shadow-sm">
        <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg mb-2">연결된 자녀가 없습니다</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          학원에서 발급한 8자리 연결 코드를 입력하거나<br />
          내 자녀를 직접 등록해 주세요
        </p>
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-left">
          <p className="text-xs font-bold text-indigo-900 mb-2">💡 연결 방법</p>
          <ul className="text-xs text-indigo-700 space-y-1">
            <li>• 학원에 연결 코드를 요청하세요</li>
            <li>• 위의 '코드 입력하기' 버튼을 눌러 코드를 입력합니다</li>
            <li>• QR 코드가 있다면 QR 버튼으로 스캔할 수 있습니다</li>
          </ul>
        </div>
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
  const activeCount = child.enrollments.filter((e) =>
    ACTIVE_ENROLLMENT_STATUSES.includes(e.status)
  ).length;
  const inactiveCount = child.enrollments.filter((e) =>
    INACTIVE_ENROLLMENT_STATUSES.includes(e.status)
  ).length;
  const unlinked = academyCount === 0;

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
          {unlinked
            ? '학원 미연결 · 코드로 연결 가능'
            : academyCount > 0
              ? `학원 ${activeCount}/${academyCount}${inactiveCount > 0 ? ` · 기록 ${inactiveCount}` : ''}`
              : '등록 학원 없음'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
    </button>
  );
}
