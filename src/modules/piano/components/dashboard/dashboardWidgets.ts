import type { AcademySettings } from '@/types';

/** 피아노 대시보드 표시 위젯 ID */
export type PianoDashboardWidgetId =
  | 'stat_total_students'
  | 'stat_active_students'
  | 'stat_new_students'
  | 'stat_tuition_revenue'
  | 'stat_unpaid_tuition'
  | 'stat_today_classes'
  | 'stat_today_present'
  | 'stat_today_absent'
  | 'stat_textbook_sales'
  | 'stat_low_stock'
  | 'stat_monthly_expenses'
  | 'stat_net_profit'
  | 'chart_revenue_trend'
  | 'chart_student_trend'
  | 'chart_tuition_breakdown'
  | 'chart_class_distribution'
  | 'panel_today_schedule'
  | 'panel_unpaid_list'
  | 'panel_textbook_sales'
  | 'panel_low_stock';

export type PianoDashboardWidgetGroup = 'metrics' | 'charts' | 'panels';

export interface PianoDashboardWidgetDef {
  id: PianoDashboardWidgetId;
  label: string;
  description: string;
  group: PianoDashboardWidgetGroup;
}

export const PIANO_DASHBOARD_WIDGET_GROUP_LABELS: Record<PianoDashboardWidgetGroup, string> = {
  metrics: '핵심 지표 카드',
  charts: '차트·분석',
  panels: '하단 패널',
};

export const PIANO_DASHBOARD_WIDGETS: PianoDashboardWidgetDef[] = [
  { id: 'stat_total_students', label: '전체 원생', description: '재원·휴원 인원 요약', group: 'metrics' },
  { id: 'stat_active_students', label: '수강 중 (재원)', description: '현재 정규 수강 원생', group: 'metrics' },
  { id: 'stat_new_students', label: '신규 등록 (이번달)', description: '당월 신규 입학', group: 'metrics' },
  { id: 'stat_tuition_revenue', label: '수강료 매출', description: '이번 달 수납액·수납률', group: 'metrics' },
  { id: 'stat_unpaid_tuition', label: '미납 수강료', description: '미납액·미납 원생', group: 'metrics' },
  { id: 'stat_today_classes', label: '오늘 수업', description: '오늘 개설 반 수', group: 'metrics' },
  { id: 'stat_today_present', label: '오늘 출석', description: '출석·지각/조퇴', group: 'metrics' },
  { id: 'stat_today_absent', label: '오늘 결석', description: '결석·미보강 안내', group: 'metrics' },
  { id: 'stat_textbook_sales', label: '교재 판매액', description: '이번 달 교재 매출', group: 'metrics' },
  { id: 'stat_low_stock', label: '재고 부족 교재', description: '최소 재고 미달 종수', group: 'metrics' },
  { id: 'stat_monthly_expenses', label: '이번 달 지출', description: '운영 지출 합계', group: 'metrics' },
  { id: 'stat_net_profit', label: '이번 달 순수익', description: '매출 대비 순이익', group: 'metrics' },
  { id: 'chart_revenue_trend', label: '매출·지출 추이', description: '최근 6개월 막대 차트', group: 'charts' },
  { id: 'chart_student_trend', label: '원생 수 추이', description: '최근 6개월 성장 곡선', group: 'charts' },
  { id: 'chart_tuition_breakdown', label: '수납 현황', description: '이번 달 수납·미납 비율', group: 'charts' },
  { id: 'chart_class_distribution', label: '반별 정원 현황', description: '반별 재원·정원 비교', group: 'charts' },
  { id: 'panel_today_schedule', label: '오늘의 수업 일정', description: '당일 시간표 카드', group: 'panels' },
  { id: 'panel_unpaid_list', label: '미납 수강료 목록', description: '최근 미납 청구', group: 'panels' },
  { id: 'panel_textbook_sales', label: '교재 판매 현황', description: '판매·수납 요약 및 이력', group: 'panels' },
  { id: 'panel_low_stock', label: '재고 부족 알림', description: '발주 필요 교재 목록', group: 'panels' },
];

export const ALL_PIANO_DASHBOARD_WIDGET_IDS = PIANO_DASHBOARD_WIDGETS.map((w) => w.id);

/** 처음 편집 시 추천하는 간결 구성 */
export const RECOMMENDED_PIANO_DASHBOARD_WIDGETS: PianoDashboardWidgetId[] = [
  'stat_total_students',
  'stat_active_students',
  'stat_tuition_revenue',
  'stat_unpaid_tuition',
  'stat_today_present',
  'stat_today_absent',
  'chart_revenue_trend',
  'chart_tuition_breakdown',
  'panel_today_schedule',
  'panel_unpaid_list',
];

export function getConfiguredDashboardWidgets(
  settings: AcademySettings
): PianoDashboardWidgetId[] | undefined {
  const raw = settings.dashboard?.widgets;
  if (raw === undefined) return undefined;
  const allowed = new Set(ALL_PIANO_DASHBOARD_WIDGET_IDS);
  return raw.filter((id): id is PianoDashboardWidgetId => allowed.has(id as PianoDashboardWidgetId));
}

/** undefined = 미설정(전체 표시), 배열 = 선택된 항목만 */
export function resolveDashboardWidgetSet(settings: AcademySettings): Set<PianoDashboardWidgetId> {
  const configured = getConfiguredDashboardWidgets(settings);
  if (configured === undefined) {
    return new Set(ALL_PIANO_DASHBOARD_WIDGET_IDS);
  }
  return new Set(configured);
}

export function isDashboardWidgetVisible(
  id: PianoDashboardWidgetId,
  settings: AcademySettings
): boolean {
  return resolveDashboardWidgetSet(settings).has(id);
}

export function getDashboardWidgetsForEditor(settings: AcademySettings): PianoDashboardWidgetId[] {
  const configured = getConfiguredDashboardWidgets(settings);
  return configured ?? [...ALL_PIANO_DASHBOARD_WIDGET_IDS];
}

export function widgetsByGroup(group: PianoDashboardWidgetGroup): PianoDashboardWidgetDef[] {
  return PIANO_DASHBOARD_WIDGETS.filter((w) => w.group === group);
}
