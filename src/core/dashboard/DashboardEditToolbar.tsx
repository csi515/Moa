import React, { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { usePermissions } from '@/core/auth/usePermissions';
import {
  DashboardCustomizeModal,
} from './DashboardCustomizeModal';
import {
  getConfiguredDashboardWidgets,
  resolveDashboardWidgetSet,
} from './widgetCatalog';

interface DashboardEditToolbarProps {
  showEmptyHint?: boolean;
}

/** 원장용 대시보드 편집 버튼 + 빈 상태 안내 + 모달 */
export const DashboardEditToolbar: React.FC<DashboardEditToolbarProps> = ({
  showEmptyHint: showEmptyHintProp,
}) => {
  const { isOwner, settings, industry } = usePermissions();
  const [open, setOpen] = useState(false);

  if (!isOwner) return null;

  const configured = getConfiguredDashboardWidgets(settings, industry);
  const showEmptyHint =
    showEmptyHintProp ?? (configured !== undefined && resolveDashboardWidgetSet(settings, industry).size === 0);

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl min-h-[44px] transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            대시보드 편집
          </button>
        </div>
        {showEmptyHint && (
          <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-6 text-center">
            <p className="text-sm font-bold text-indigo-900">표시할 대시보드 항목이 없습니다</p>
            <p className="text-xs text-indigo-700 mt-1">대시보드 편집에서 필요한 기능을 선택해 주세요.</p>
          </div>
        )}
      </div>
      <DashboardCustomizeModal
        isOpen={open}
        onClose={() => setOpen(false)}
        settings={settings}
        industry={industry}
      />
    </>
  );
};
