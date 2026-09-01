import type { ReactNode } from 'react';

type GridColumns = '2-3' | '2-4' | '2-6';

const GRID_CLASS: Record<GridColumns, string> = {
  '2-3': 'grid grid-cols-2 sm:grid-cols-3 gap-3',
  '2-4': 'grid grid-cols-2 sm:grid-cols-4 gap-3',
  '2-6': 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3',
};

interface DashboardMetricGridProps {
  columns?: GridColumns;
  children: ReactNode[];
}

/** 표시할 지표 카드가 있을 때만 그리드 렌더 */
export function DashboardMetricGrid({ columns = '2-4', children }: DashboardMetricGridProps) {
  const items = children.filter(Boolean);
  if (items.length === 0) return null;

  return <div className={GRID_CLASS[columns]}>{items}</div>;
}
