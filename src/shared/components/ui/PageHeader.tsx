import React, { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  iconClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  icon,
  title,
  description,
  actions,
  iconClassName = 'text-indigo-600',
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 className={`text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2`}>
          <span className={iconClassName}>{icon}</span>
          {title}
        </h2>
        {description && (
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};
