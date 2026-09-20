import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import { POINT_WON_VALUE, readOrgPointsEarnConfig } from './earnPolicy';
import type { PointTransaction } from './types';

type AccountRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  balance: number | string;
};

type TxRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  type: 'earn' | 'redeem' | 'adjust';
  amount: number | string;
  balance_after: number | string;
  earn_rate_percent: number | string | null;
  base_amount: number | string | null;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
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

function mapTx(row: TxRow): PointTransaction {
  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    type: row.type,
    amount: toNumber(row.amount),
    balanceAfter: toNumber(row.balance_after),
    earnRatePercent:
      row.earn_rate_percent == null ? null : toNumber(row.earn_rate_percent),
    baseAmount: row.base_amount == null ? null : toNumber(row.base_amount),
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    description: row.description,
    createdAt: row.created_at,
  };
}

/** 사용 가능 상한: min(잔액, 결제총액), 정수 P */
export function maxRedeemablePoints(balance: number, saleTotalWon: number): number {
  return Math.max(
    0,
    Math.min(Math.floor(Math.max(0, balance)), Math.floor(Math.max(0, saleTotalWon)))
  );
}

export type SalePointRedeemResult = {
  skipped: boolean;
  reason?:
    | 'no_customer'
    | 'points_disabled'
    | 'zero_points'
    | 'insufficient_balance'
    | 'exceeds_total'
    | 'already_redeemed';
  pointsUsed: number;
  transaction: PointTransaction | null;
};

/**
 * 판매 시 포인트 사용(redeem).
 * 1P = 1원. amount는 음수. 잔액은 거래 후 balance_after로 일치시킴(직접 덮어쓰기 금지 패턴:
 * 현재잔액 조회 → 거래 insert → 잔액 update).
 */
export const pointRedeemService = {
  async getBalance(organizationId: string, customerId: string): Promise<number> {
    const client = ensureClient();
    const { data, error } = await client
      .from('point_accounts')
      .select('balance')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (error) throw error;
    return data ? toNumber((data as { balance: number | string }).balance) : 0;
  },

  /** 포인트 사용 기능 ON 여부 (organizations.settings) */
  async isRedeemEnabled(organizationId: string): Promise<boolean> {
    const client = ensureClient();
    const { data, error } = await client
      .from('organizations')
      .select('settings')
      .eq('id', organizationId)
      .maybeSingle();
    if (error) throw error;
    return readOrgPointsEarnConfig(data?.settings).enabled;
  },

  async redeemForSale(params: {
    organizationId: string;
    customerId: string | null | undefined;
    saleId: string;
    /** 사용할 포인트(양수, 1P=1원) */
    pointsToUse: number;
    /** 상품 합계(원) — 사용액 상한 */
    saleTotalAmount: number;
  }): Promise<SalePointRedeemResult> {
    const customerId = params.customerId?.trim() || null;
    const requested = Math.floor(Number(params.pointsToUse) || 0);

    if (requested <= 0) {
      return {
        skipped: true,
        reason: 'zero_points',
        pointsUsed: 0,
        transaction: null,
      };
    }
    if (!customerId) {
      throw new Error('포인트를 사용하려면 고객을 선택해 주세요.');
    }

    const client = ensureClient();
    const { data: orgRow, error: orgError } = await client
      .from('organizations')
      .select('settings')
      .eq('id', params.organizationId)
      .maybeSingle();
    if (orgError) throw orgError;

    const config = readOrgPointsEarnConfig(orgRow?.settings);
    if (!config.enabled) {
      throw new Error('포인트 사용이 비활성화되어 있습니다.');
    }

    if (POINT_WON_VALUE !== 1) {
      throw new Error('포인트 환산 설정이 올바르지 않습니다.');
    }

    const saleTotal = Math.max(0, Number(params.saleTotalAmount) || 0);
    if (requested > saleTotal) {
      throw new Error('사용 포인트는 결제금액을 초과할 수 없습니다.');
    }

    const { data: account, error: findError } = await client
      .from('point_accounts')
      .select('*')
      .eq('organization_id', params.organizationId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (findError) throw findError;
    if (!account) {
      throw new Error('사용 가능한 포인트가 없습니다.');
    }

    const accountRow = account as AccountRow;
    const balance = toNumber(accountRow.balance);
    if (requested > balance) {
      throw new Error(
        `포인트가 부족합니다. (잔액 ${balance}P, 요청 ${requested}P)`
      );
    }

    const delta = -requested;
    const balanceAfter = balance + delta;
    if (balanceAfter < 0) {
      throw new Error('포인트 잔액이 부족합니다.');
    }

    const { data: txRow, error: txError } = await client
      .from('point_transactions')
      .insert({
        organization_id: params.organizationId,
        customer_id: customerId,
        type: 'redeem',
        amount: delta,
        balance_after: balanceAfter,
        earn_rate_percent: null,
        base_amount: null,
        reference_type: 'sale',
        reference_id: params.saleId,
        description: `판매 포인트 사용 ${requested}P`,
      })
      .select('*')
      .single();

    if (txError) {
      if (txError.code === '23505') {
        return {
          skipped: true,
          reason: 'already_redeemed',
          pointsUsed: 0,
          transaction: null,
        };
      }
      throw txError;
    }

    const { error: updateError } = await client
      .from('point_accounts')
      .update({ balance: balanceAfter })
      .eq('id', accountRow.id)
      .eq('organization_id', params.organizationId);
    if (updateError) throw updateError;

    return {
      skipped: false,
      pointsUsed: requested,
      transaction: mapTx(txRow as TxRow),
    };
  },
};
