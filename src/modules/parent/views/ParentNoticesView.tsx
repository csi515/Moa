import { useMemo } from 'react';
import { StorageService } from '@/services/storage';
import { useStorageRefresh } from '@/hooks';
import type { Student } from '@/types';
import { PARENT_NOTICE_KIND_LABEL, getNoticesForStudent, type ParentNoticeKind } from '@/core/notices';
import { Section } from './shared';

export function ParentNoticesView({ student }: { student: Student }) {
  const refreshKey = useStorageRefresh();
  const notices = useMemo(
    () => getNoticesForStudent(StorageService.getNotifications(), student),
    [student, refreshKey]
  );

  return (
    <Section title="가정통신문 · 안내장">
      {notices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">게시된 안내가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {notices.map((n) => (
            <article
              key={n.id}
              className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">
                  {PARENT_NOTICE_KIND_LABEL[n.type as ParentNoticeKind] || '안내'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {(n.sentAt || n.createdAt || '').slice(0, 10)}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900">{n.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-wrap">
                {n.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </Section>
  );
}
