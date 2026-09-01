import { useMemo } from 'react';
import { usePermissions } from '@/core/auth/usePermissions';
import type { IndustryType } from '@/core/industry/types';
import { isDashboardWidgetVisible } from './widgetCatalog';
import type { DashboardWidgetId } from './widgetCatalog';

/** 업종별 대시보드 위젯 표시 여부 훅 */
export function useDashboardWidgetVisibility<I extends IndustryType>(industry: I) {
  const { settings } = usePermissions();

  return useMemo(
    () => (id: DashboardWidgetId<I>) => isDashboardWidgetVisible(id, settings, industry),
    [settings, industry]
  );
}
