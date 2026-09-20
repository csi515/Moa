import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import type { SalePaymentMethod } from '../types/sale';
import type {
  RevenueDateRange,
  RevenuePaymentBreakdown,
  RevenuePeriodPreset,
  RevenueProductBreakdown,
  RetailRevenueSummary,
} from '../types/revenue';

type SaleRow = {
  id: string;
  total_amount: number | string;
  payment_method: SalePaymentMethod;
  created_at: string;
};

type SaleItemRow = {
  sale_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  quantity: number | string;
  line_amount: number | string;
};

type ReturnRow = {
  id: string;
  total_amount: number | string;
};

function toNumber(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function ensureClient() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase가 설정되지 않았습니다.');
  }
  return getCoreClient();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** 로컬 YYYY-MM-DD → [startIso, endIso) UTC */
function localDayRange(dateYmd: string): { startIso: string; endIso: string } {
  const [y, m, d] = dateYmd.split('-').map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function addDaysYmd(dateYmd: string, days: number): string {
  const [y, m, d] = dateYmd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days, 0, 0, 0, 0);
  return toYmd(dt);
}

/** inclusive from~to → [startIso, endExclusiveIso) */
function inclusiveRangeIso(range: RevenueDateRange): {
  startIso: string;
  endExclusiveIso: string;
} {
  const { startIso } = localDayRange(range.fromYmd);
  const { endIso } = localDayRange(range.toYmd);
  return { startIso, endExclusiveIso: endIso };
}

/**
 * Sale / SaleReturn 집계만 수행.
 * Finance 회계·포인트 잔액과 무관. 반품은 매출에 합산하지 않음.
 */
export const retailRevenueService = {
  todayYmd(): string {
    return toYmd(new Date());
  },

  resolvePresetRange(preset: RevenuePeriodPreset, custom?: RevenueDateRange): RevenueDateRange {
    const today = this.todayYmd();
    if (preset === 'today') {
      return { fromYmd: today, toYmd: today };
    }
    if (preset === 'week') {
      const now = new Date();
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      return { fromYmd: toYmd(monday), toYmd: today };
    }
    if (preset === 'month') {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      return { fromYmd: toYmd(first), toYmd: today };
    }
    const from = custom?.fromYmd?.trim() || today;
    const to = custom?.toYmd?.trim() || today;
    return from <= to ? { fromYmd: from, toYmd: to } : { fromYmd: to, toYmd: from };
  },

  async getSummary(params: {
    organizationId: string;
    range: RevenueDateRange;
  }): Promise<RetailRevenueSummary> {
    const orgId = params.organizationId?.trim();
    if (!orgId) throw new Error('사업장이 필요합니다.');

    const range = this.resolvePresetRange('custom', params.range);
    const { startIso, endExclusiveIso } = inclusiveRangeIso(range);
    const client = ensureClient();

    const [salesRes, returnsRes] = await Promise.all([
      client
        .from('sales')
        .select('id, total_amount, payment_method, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', startIso)
        .lt('created_at', endExclusiveIso)
        .order('created_at', { ascending: false }),
      client
        .from('sale_returns')
        .select('id, total_amount')
        .eq('organization_id', orgId)
        .gte('created_at', startIso)
        .lt('created_at', endExclusiveIso),
    ]);
    if (salesRes.error) throw salesRes.error;
    if (returnsRes.error) throw returnsRes.error;

    const sales = (salesRes.data as SaleRow[] | null) ?? [];
    const returns = (returnsRes.data as ReturnRow[] | null) ?? [];

    let totalSalesAmount = 0;
    const paymentMap = new Map<SalePaymentMethod, { amount: number; count: number }>();
    for (const sale of sales) {
      const amount = toNumber(sale.total_amount);
      totalSalesAmount += amount;
      const prev = paymentMap.get(sale.payment_method) ?? { amount: 0, count: 0 };
      paymentMap.set(sale.payment_method, {
        amount: prev.amount + amount,
        count: prev.count + 1,
      });
    }

    const byPayment: RevenuePaymentBreakdown[] = [...paymentMap.entries()]
      .map(([paymentMethod, v]) => ({
        paymentMethod,
        amount: v.amount,
        count: v.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    let totalReturnAmount = 0;
    for (const row of returns) {
      totalReturnAmount += toNumber(row.total_amount);
    }

    const saleIds = sales.map((s) => s.id);
    const byProduct = await this.aggregateProducts(saleIds);

    return {
      range,
      totalSalesAmount,
      saleCount: sales.length,
      totalReturnAmount,
      returnCount: returns.length,
      byPayment,
      byProduct,
    };
  },

  async aggregateProducts(saleIds: string[]): Promise<RevenueProductBreakdown[]> {
    if (saleIds.length === 0) return [];
    const client = ensureClient();

    // chunk in case of large ranges
    const chunkSize = 200;
    const allItems: SaleItemRow[] = [];
    for (let i = 0; i < saleIds.length; i += chunkSize) {
      const chunk = saleIds.slice(i, i + chunkSize);
      const { data, error } = await client
        .from('sale_items')
        .select('sale_id, product_id, product_name_snapshot, quantity, line_amount')
        .in('sale_id', chunk);
      if (error) throw error;
      allItems.push(...((data as SaleItemRow[] | null) ?? []));
    }

    const map = new Map<string, RevenueProductBreakdown>();
    for (const item of allItems) {
      const key = item.product_id ?? `name:${item.product_name_snapshot}`;
      const prev = map.get(key) ?? {
        key,
        productId: item.product_id,
        productNameSnapshot: item.product_name_snapshot,
        quantity: 0,
        amount: 0,
      };
      prev.quantity += toNumber(item.quantity);
      prev.amount += toNumber(item.line_amount);
      map.set(key, prev);
    }

    return [...map.values()].sort((a, b) => b.quantity - a.quantity || b.amount - a.amount);
  },

  /** 테스트·표시용: from이 to보다 뒤면 교환 */
  normalizeRange(range: RevenueDateRange): RevenueDateRange {
    return this.resolvePresetRange('custom', range);
  },

  /** 기간 길이 제한 없음 — UI에서 안내만 */
  addDaysYmd,
};
