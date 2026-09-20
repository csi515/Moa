import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import {
  computeEarnPoints,
  readOrgPointsEarnConfig,
} from './earnPolicy';
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

export type SalePointEarnResult = {
  skipped: boolean;
  reason?:
    | 'no_customer'
    | 'points_disabled'
    | 'earn_disabled'
    | 'zero_points'
    | 'zero_amount'
    | 'already_earned';
  pointsEarned: number;
  earnRatePercent: number | null;
  baseAmount: number | null;
  transaction: PointTransaction | null;
};

/**
 * 판매 완료 후 포인트 적립.
 * 고객 연결 · 포인트/적립 ON · floor(금액×적립률/100).
 * 적용 적립률·기준금액·적립P를 point_transactions에 스냅샷 저장.
 */
export const pointEarnService = {
  async earnForSale(params: {
    organizationId: string;
    customerId: string | null | undefined;
    saleId: string;
    eligibleAmount: number;
  }): Promise<SalePointEarnResult> {
    const customerId = params.customerId?.trim() || null;
    if (!customerId) {
      return {
        skipped: true,
        reason: 'no_customer',
        pointsEarned: 0,
        earnRatePercent: null,
        baseAmount: null,
        transaction: null,
      };
    }

    const eligibleAmount = Math.max(0, Number(params.eligibleAmount) || 0);
    if (eligibleAmount <= 0) {
      return {
        skipped: true,
        reason: 'zero_amount',
        pointsEarned: 0,
        earnRatePercent: null,
        baseAmount: eligibleAmount,
        transaction: null,
      };
    }

    const client = ensureClient();
    const { data: orgRow, error: orgError } = await client
      .from('organizations')
      .select('settings')
      .eq('id', params.organizationId)
      .maybeSingle();
    if (orgError) throw orgError;

    const points = readOrgPointsEarnConfig(orgRow?.settings);

    if (!points.enabled) {
      return {
        skipped: true,
        reason: 'points_disabled',
        pointsEarned: 0,
        earnRatePercent: points.earnRatePercent,
        baseAmount: eligibleAmount,
        transaction: null,
      };
    }
    if (!points.earnEnabled || points.earnRatePercent <= 0) {
      return {
        skipped: true,
        reason: 'earn_disabled',
        pointsEarned: 0,
        earnRatePercent: points.earnRatePercent,
        baseAmount: eligibleAmount,
        transaction: null,
      };
    }

    const earnRatePercent = points.earnRatePercent;
    const pointsEarned = computeEarnPoints(eligibleAmount, earnRatePercent);
    if (pointsEarned <= 0) {
      return {
        skipped: true,
        reason: 'zero_points',
        pointsEarned: 0,
        earnRatePercent,
        baseAmount: eligibleAmount,
        transaction: null,
      };
    }

    let { data: account, error: findError } = await client
      .from('point_accounts')
      .select('*')
      .eq('organization_id', params.organizationId)
      .eq('customer_id', customerId)
      .maybeSingle();
    if (findError) throw findError;

    if (!account) {
      const { data: created, error: createError } = await client
        .from('point_accounts')
        .insert({
          organization_id: params.organizationId,
          customer_id: customerId,
          balance: 0,
        })
        .select('*')
        .single();
      if (createError) {
        const { data: again, error: againError } = await client
          .from('point_accounts')
          .select('*')
          .eq('organization_id', params.organizationId)
          .eq('customer_id', customerId)
          .maybeSingle();
        if (againError) throw againError;
        if (!again) throw createError;
        account = again;
      } else {
        account = created;
      }
    }

    const accountRow = account as AccountRow;
    const balanceAfter = toNumber(accountRow.balance) + pointsEarned;

    const { data: txRow, error: txError } = await client
      .from('point_transactions')
      .insert({
        organization_id: params.organizationId,
        customer_id: customerId,
        type: 'earn',
        amount: pointsEarned,
        balance_after: balanceAfter,
        earn_rate_percent: earnRatePercent,
        base_amount: eligibleAmount,
        reference_type: 'sale',
        reference_id: params.saleId,
        description: `판매 적립 ${earnRatePercent}%`,
      })
      .select('*')
      .single();

    if (txError) {
      if (txError.code === '23505') {
        return {
          skipped: true,
          reason: 'already_earned',
          pointsEarned: 0,
          earnRatePercent,
          baseAmount: eligibleAmount,
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
      pointsEarned,
      earnRatePercent,
      baseAmount: eligibleAmount,
      transaction: mapTx(txRow as TxRow),
    };
  },
};
