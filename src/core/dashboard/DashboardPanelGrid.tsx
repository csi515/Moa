import type { ReactNode } from 'react';

interface DashboardPanelItem {
  key: string;
  visible: boolean;
  content: ReactNode;
}

interface DashboardPanelGridProps {
  panels: DashboardPanelItem[];
}

/** 표시할 패널이 있을 때만 2열 그리드 렌더 */
export function DashboardPanelGrid({ panels }: DashboardPanelGridProps) {
  const visiblePanels = panels.filter((panel) => panel.visible);
  if (visiblePanels.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {visiblePanels.map((panel) => (
        <div key={panel.key}>{panel.content}</div>
      ))}
    </div>
  );
}
