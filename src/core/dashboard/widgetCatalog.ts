import type { IndustryType } from '@/core/industry/types';
import type { AcademySettings } from '@/types';

export type DashboardWidgetGroup = 'metrics' | 'charts' | 'panels';

export interface DashboardWidgetDef {
  id: string;
  label: string;
  description: string;
  group: DashboardWidgetGroup;
}

export const DASHBOARD_WIDGET_GROUP_LABELS: Record<DashboardWidgetGroup, string> = {
  metrics: '핵심 지표 카드',
  charts: '차트·분석',
  panels: '하단 패널',
};

export const GROUP_ORDER: DashboardWidgetGroup[] = ['metrics', 'charts', 'panels'];

/** 업종별 대시보드 위젯 카탈로그 */
export const DASHBOARD_WIDGET_CATALOG: Record<IndustryType, DashboardWidgetDef[]> = {
  piano: [
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
  ],
  pilates: [
    { id: 'stat_today_bookings', label: '오늘 예약', description: '당일 예약 건수', group: 'metrics' },
    { id: 'stat_confirmed_bookings', label: '확정/예약', description: '확정·예약 상태 건수', group: 'metrics' },
    { id: 'stat_active_members', label: '재적 회원', description: '현재 활성 회원 수', group: 'metrics' },
    { id: 'stat_service_types', label: '수업 종류', description: '운영 중 수업 종류 수', group: 'metrics' },
    { id: 'panel_today_bookings', label: '오늘 예약 목록', description: '당일 예약 상세', group: 'panels' },
    { id: 'panel_upcoming_bookings', label: '다가오는 예약', description: '예정된 예약 일정', group: 'panels' },
    { id: 'panel_quick_links', label: '회원·강사 바로가기', description: '빠른 이동 카드', group: 'panels' },
  ],
  gym: [
    { id: 'stat_active_members', label: '재적 회원', description: '현재 활성 회원 수', group: 'metrics' },
    { id: 'stat_checked_in', label: '오늘 입실', description: '당일 입실 인원', group: 'metrics' },
    { id: 'stat_teachers', label: '강사', description: '활성 강사 수', group: 'metrics' },
    { id: 'stat_classes', label: '수업반', description: '운영 중 수업반 수', group: 'metrics' },
    { id: 'panel_recent_members', label: '최근 등록 회원', description: '신규·최근 회원 목록', group: 'panels' },
    { id: 'panel_attendance_summary', label: '오늘 출입 요약', description: '입실·재적 요약 및 출입 관리', group: 'panels' },
  ],
  daycare: [
    { id: 'stat_active_children', label: '재원 원아', description: '현재 재원 원아 수', group: 'metrics' },
    { id: 'stat_checked_in', label: '오늘 등원', description: '당일 등원 인원', group: 'metrics' },
    { id: 'stat_today_journals', label: '오늘 알림장', description: '당일 작성 알림장', group: 'metrics' },
    { id: 'stat_pending_meds', label: '투약 대기', description: '처리 대기 투약 의뢰', group: 'metrics' },
    { id: 'stat_teachers', label: '교사', description: '활성 교사 수', group: 'metrics' },
    { id: 'stat_classes', label: '운영 반', description: '운영 중 반 수', group: 'metrics' },
    { id: 'panel_recent_children', label: '최근 등록 원아', description: '신규·최근 원아 목록', group: 'panels' },
    { id: 'panel_attendance_care', label: '등하원·보육', description: '등하원 요약 및 보육 바로가기', group: 'panels' },
  ],
};

export const RECOMMENDED_DASHBOARD_WIDGETS: Record<IndustryType, string[]> = {
  piano: [
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
  ],
  pilates: [
    'stat_today_bookings',
    'stat_confirmed_bookings',
    'stat_active_members',
    'panel_today_bookings',
    'panel_upcoming_bookings',
  ],
  gym: [
    'stat_active_members',
    'stat_checked_in',
    'stat_classes',
    'panel_recent_members',
    'panel_attendance_summary',
  ],
  daycare: [
    'stat_active_children',
    'stat_checked_in',
    'stat_today_journals',
    'stat_pending_meds',
    'panel_recent_children',
    'panel_attendance_care',
  ],
};

export function getAllWidgetIds(industry: IndustryType): string[] {
  return DASHBOARD_WIDGET_CATALOG[industry].map((w) => w.id);
}

export function widgetsByGroup(industry: IndustryType, group: DashboardWidgetGroup): DashboardWidgetDef[] {
  return DASHBOARD_WIDGET_CATALOG[industry].filter((w) => w.group === group);
}

function getStoredWidgets(settings: AcademySettings, industry: IndustryType): string[] | undefined {
  const byIndustry = settings.dashboard?.widgetsByIndustry?.[industry];
  if (byIndustry !== undefined) return byIndustry;

  // 피아노 레거시: dashboard.widgets
  if (industry === 'piano' && settings.dashboard?.widgets !== undefined) {
    return settings.dashboard.widgets;
  }

  return undefined;
}

export function getConfiguredDashboardWidgets(
  settings: AcademySettings,
  industry: IndustryType
): string[] | undefined {
  const raw = getStoredWidgets(settings, industry);
  if (raw === undefined) return undefined;
  const allowed = new Set(getAllWidgetIds(industry));
  return raw.filter((id) => allowed.has(id));
}

export function resolveDashboardWidgetSet(
  settings: AcademySettings,
  industry: IndustryType
): Set<string> {
  const configured = getConfiguredDashboardWidgets(settings, industry);
  if (configured === undefined) {
    return new Set(getAllWidgetIds(industry));
  }
  return new Set(configured);
}

export function isDashboardWidgetVisible(
  id: string,
  settings: AcademySettings,
  industry: IndustryType
): boolean {
  return resolveDashboardWidgetSet(settings, industry).has(id);
}

export function saveDashboardWidgets(
  industry: IndustryType,
  widgets: string[],
  settings: AcademySettings
): Partial<AcademySettings> {
  const nextByIndustry = {
    ...(settings.dashboard?.widgetsByIndustry ?? {}),
    [industry]: widgets,
  };
  return {
    dashboard: {
      ...settings.dashboard,
      widgetsByIndustry: nextByIndustry,
    },
  };
}

export const DASHBOARD_HEADER_HINT: Partial<Record<IndustryType, string>> = {
  piano: '상단 환영 배너는 항상 표시됩니다.',
  pilates: '상단 대시보드 제목 영역은 항상 표시됩니다.',
  gym: '상단 대시보드 제목 영역은 항상 표시됩니다.',
  daycare: '상단 대시보드 제목 영역은 항상 표시됩니다.',
};
