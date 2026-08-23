import React, { ReactNode } from 'react';

interface Props {
  columns: [string, string?];
  children: ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  footer?: ReactNode;
}

/** 원생별 행 목록 테이블 셸 */
export const AcademyStudentRoster: React.FC<Props> = ({
  columns,
  children,
  emptyMessage = '표시할 원생이 없습니다',
  isEmpty,
  footer,
}) => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div
      className={`hidden sm:grid gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase ${
        columns[1] ? 'sm:grid-cols-[1fr_auto]' : 'sm:grid-cols-1'
      }`}
    >
      <span>{columns[0]}</span>
      {columns[1] && <span>{columns[1]}</span>}
    </div>
    <div className="divide-y divide-slate-100">
      {isEmpty ? (
        <p className="text-sm text-slate-400 text-center py-8">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
    {footer && <div className="p-4 border-t border-slate-100 bg-slate-50/50">{footer}</div>}
  </div>
);
