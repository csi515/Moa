import { useMemo } from 'react';
import { StorageService } from '@/services/storage';
import { getNoticesForStudent, NOTICE_COPY } from '@/core/notices';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { Section } from './shared';

export function ParentNoticePreview({
  student,
  onNavigate,
}: {
  student: Student;
  onNavigate: (t: ParentPortalTab) => void;
}) {
  const notices = useMemo(
    () => getNoticesForStudent(StorageService.getNotifications(), student).slice(0, 3),
    [student]
  );

  return (
    <Section title={NOTICE_COPY.parentSectionTitle}>
      {notices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">{NOTICE_COPY.parentEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {notices.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => onNavigate('notices')} className="w-full text-left">
                <p className="text-sm font-bold text-slate-800 truncate">{n.title}</p>
                <p className="text-[11px] text-slate-400">
                  {(n.sentAt || n.createdAt || '').slice(0, 10)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function ParentHeroCard({
  student,
  subtitle,
  gradientClass,
}: {
  student: Student;
  subtitle: string;
  gradientClass: string;
}) {
  return (
    <div className={`${gradientClass} rounded-2xl p-5 text-white`}>
      <p className="text-white/70 text-xs">{subtitle}</p>
      <h2 className="text-2xl font-black mt-1">{student.name}</h2>
      <p className="text-sm text-white/80 mt-1">담당: {student.teacherName || '미지정'}</p>
    </div>
  );
}
