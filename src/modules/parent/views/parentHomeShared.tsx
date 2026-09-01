import { useParentPortalNotifications } from '@/core/parent/hooks/useParentPortalNotifications';
import { NOTICE_COPY, type ParentPortalNotificationKind, PARENT_PORTAL_NOTIFICATION_LABEL } from '@/core/notices';
import type { ParentPortalTab } from '@/types/education';
import type { Student } from '@/types';
import { Section } from './shared';

export function ParentNoticePreview({
  student,
  organizationId,
  onNavigate,
}: {
  student: Student;
  organizationId: string;
  onNavigate: (t: ParentPortalTab) => void;
}) {
  const { notifications } = useParentPortalNotifications(organizationId, student, 5);
  const notices = notifications.slice(0, 3);

  return (
    <Section title={NOTICE_COPY.parentSectionTitle}>
      {notices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-4">{NOTICE_COPY.parentEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {notices.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => onNavigate('notices')} className="w-full text-left">
                <div className="flex items-center gap-2">
                  {n.type === 'attendance' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 shrink-0">
                      {PARENT_PORTAL_NOTIFICATION_LABEL[n.type as ParentPortalNotificationKind]}
                    </span>
                  )}
                  <p className="text-sm font-bold text-slate-800 truncate">{n.title}</p>
                </div>
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
