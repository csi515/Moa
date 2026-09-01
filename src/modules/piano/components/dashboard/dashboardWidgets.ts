import type { AcademySettings } from '@/types';
import {
  getConfiguredDashboardWidgets as getConfiguredCore,
  isDashboardWidgetVisible as isVisibleCore,
  resolveDashboardWidgetSet as resolveCore,
  DASHBOARD_WIDGET_CATALOG,
} from '@/core/dashboard';

/** 피아노 대시보드 표시 위젯 ID */
export type PianoDashboardWidgetId =
  (typeof DASHBOARD_WIDGET_CATALOG.piano)[number]['id'];

export type PianoDashboardWidgetGroup = 'metrics' | 'charts' | 'panels';

export function getConfiguredDashboardWidgets(
  settings: AcademySettings
): PianoDashboardWidgetId[] | undefined {
  return getConfiguredCore(settings, 'piano') as PianoDashboardWidgetId[] | undefined;
}

export function resolveDashboardWidgetSet(settings: AcademySettings): Set<PianoDashboardWidgetId> {
  return resolveCore(settings, 'piano') as Set<PianoDashboardWidgetId>;
}

export function isDashboardWidgetVisible(
  id: PianoDashboardWidgetId,
  settings: AcademySettings
): boolean {
  return isVisibleCore(id, settings, 'piano');
}
