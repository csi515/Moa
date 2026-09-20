import type { RevenuePeriodPreset } from '../../types/revenue';

/** Retail 매출 관리 문구 */
export const RETAIL_REVENUE_COPY = {
  title: '매출',
  description: '판매(Sale) 기준으로 기간별 매출을 확인합니다',
  noOrg: '사업장을 선택해 주세요',
  loadError: '매출 정보를 불러오지 못했습니다',
  loading: '불러오는 중…',
  periodToday: '오늘',
  periodWeek: '이번 주',
  periodMonth: '이번 달',
  periodCustom: '기간 선택',
  fromLabel: '시작일',
  toLabel: '종료일',
  applyRange: '조회',
  customHint: '기간을 선택한 뒤 조회를 눌러 주세요',
  totalSales: '총매출',
  saleCount: '판매건수',
  saleCountUnit: '건',
  returnAmount: '반품 금액',
  returnCount: '반품 건수',
  returnHint: '반품은 별도 거래이며 총매출에 합산하지 않습니다',
  paymentSection: '결제수단별 매출',
  paymentEmpty: '해당 기간 판매가 없습니다',
  productSection: '상품별 판매량',
  productEmpty: '해당 기간 판매 상품이 없습니다',
  productQty: '수량',
  productAmount: '금액',
  qtyUnit: '개',
  countUnit: '건',
  rangeLabel: (from: string, to: string) =>
    from === to ? from : `${from} ~ ${to}`,
} as const;

export const REVENUE_PERIOD_TABS: Array<{
  id: RevenuePeriodPreset;
  label: string;
}> = [
  { id: 'today', label: RETAIL_REVENUE_COPY.periodToday },
  { id: 'week', label: RETAIL_REVENUE_COPY.periodWeek },
  { id: 'month', label: RETAIL_REVENUE_COPY.periodMonth },
  { id: 'custom', label: RETAIL_REVENUE_COPY.periodCustom },
];
