import type { FC } from 'react';
import { Users, UserPlus } from 'lucide-react';
import type { Student } from '@/types';
import { EmptyState } from '@/shared/components';
import { DASHBOARD_ACCENT_STYLES, type DashboardAccent } from './dashboardAccent';

interface RecentRegistrationsPanelProps {
  customers: Student[];
  accent: DashboardAccent;
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  addLabel: string;
  dateLabel: string;
  onViewAll: () => void;
  onAdd: () => void;
  onSelect: (customerId: string) => void;
}

export const RecentRegistrationsPanel: FC<RecentRegistrationsPanelProps> = ({
  customers,
  accent,
  title,
  emptyTitle,
  emptyDescription,
  addLabel,
  dateLabel,
  onViewAll,
  onAdd,
  onSelect,
}) => {
  const styles = DASHBOARD_ACCENT_STYLES[accent];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Users className={`w-4 h-4 ${styles.icon}`} />
          {title}
        </h3>
        <button
          type="button"
          onClick={onViewAll}
          className={`text-xs font-bold ${styles.link} hover:underline min-h-[44px] px-2`}
        >
          전체 보기
        </button>
      </div>
      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title={emptyTitle}
          description={emptyDescription}
          action={
            <button
              type="button"
              onClick={onAdd}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-white text-xs font-bold ${styles.primaryButton}`}
            >
              <UserPlus className="w-4 h-4" />
              {addLabel}
            </button>
          }
          className="p-6 border-0 shadow-none bg-slate-50/50 rounded-xl"
        />
      ) : (
        <div className="space-y-2">
          {[...customers]
            .sort((a, b) => b.joinDate.localeCompare(a.joinDate))
            .slice(0, 6)
            .map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => onSelect(customer.id)}
                className={`w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 ${styles.hoverBorder} ${styles.hoverBg} transition-colors min-h-[44px]`}
              >
                <p className="font-bold text-slate-900 text-sm">{customer.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {customer.level} · {dateLabel} {customer.joinDate.slice(0, 10)}
                </p>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
