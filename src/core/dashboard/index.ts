export { DashboardCustomizeModal } from './DashboardCustomizeModal';
export { DashboardEditToolbar } from './DashboardEditToolbar';
export { DashboardMetricGrid } from './DashboardMetricGrid';
export { DashboardPanelGrid } from './DashboardPanelGrid';
export { useDashboardWidgetVisibility } from './useDashboardWidgetVisibility';
export { AttendanceSummaryPanel } from './panels/AttendanceSummaryPanel';
export { RecentRegistrationsPanel } from './panels/RecentRegistrationsPanel';
export {
  DASHBOARD_WIDGET_CATALOG,
  DASHBOARD_WIDGET_GROUP_LABELS,
  RECOMMENDED_DASHBOARD_WIDGETS,
  getAllWidgetIds,
  getConfiguredDashboardWidgets,
  isDashboardWidgetVisible,
  resolveDashboardWidgetSet,
  saveDashboardWidgets,
  widgetsByGroup,
} from './widgetCatalog';
export type {
  DashboardWidgetDef,
  DashboardWidgetGroup,
  DashboardWidgetId,
  PianoDashboardWidgetId,
  GymDashboardWidgetId,
  PilatesDashboardWidgetId,
  DaycareDashboardWidgetId,
} from './widgetCatalog';
