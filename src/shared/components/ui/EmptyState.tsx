import React, { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-200 ${className}`}>
      <div className="mx-auto mb-4 text-slate-300">{icon}</div>
      <h3 className="font-bold text-slate-700 text-base">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
