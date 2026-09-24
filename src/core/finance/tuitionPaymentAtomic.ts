/**
 * 수강료 수납·월 청구 원자 클라이언트.
 * 온라인: core.record_tuition_payment / core.ensure_monthly_tuition_invoice
 * demo/offline: invoicePaymentService local 경로
 */
import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import { getOrganizationId, getStorageAdapter, STORAGE_KEYS } from '@/services/adapters';
import { paymentRowToInvoice } from '@/services/adapters/sync/mappers/invoiceMappers';
import { transactionRowToTuitionPayment } from '@/services/adapters/sync/financeEntityMappers';
import type { PaymentMethod, TuitionInvoice, TuitionPayment } from '@/types';
import type { Json } from '@/lib/supabase/database.types';
import { upsertLinkedIncome } from '@/core/finance/billingIncomeLink';
import { settleLinkedTextbookSalesOnTuitionPaid } from '@/core/finance/linkedTextbookSettle';
import { StorageService } from '@/services/storage';
import { todayIsoLocal } from '@/shared/utils/localDate';

const APP_TO_DB: Record<string, string> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
  local_currency: 'local_currency',
  onsite_card: 'onsite_card',
};

export function newPaymentIdempotencyKey(): string {
  return crypto.randomUUID();
}

type InvoiceRow = Parameters<typeof paymentRowToInvoice>[0];
type TxRow = Parameters<typeof transactionRowToTuitionPayment>[0];

function writeInvoiceMirror(invoice: TuitionInvoice): void {
  const adapter = getStorageAdapter();
  const list = adapter.getItem<TuitionInvoice[]>(STORAGE_KEYS.INVOICES, []);
  const idx = list.findIndex((i) => i.id === invoice.id);
  const next = list.slice();
  if (idx >= 0) next[idx] = invoice;
  else next.unshift(invoice);
  if (adapter.writeLocalMirror) adapter.writeLocalMirror(STORAGE_KEYS.INVOICES, next);
  else StorageService.saveInvoice(invoice);
}

function writeTuitionPaymentMirror(payment: TuitionPayment): void {
  const adapter = getStorageAdapter();
  const list = adapter.getItem<TuitionPayment[]>(STORAGE_KEYS.TUITION_PAYMENTS, []);
  if (list.some((p) => p.id === payment.id)) return;
  const next = [payment, ...list];
  if (adapter.writeLocalMirror) adapter.writeLocalMirror(STORAGE_KEYS.TUITION_PAYMENTS, next);
}

export async function recordTuitionPaymentAtomic(params: {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
  paymentDate?: string;
  cashReceiptIssued?: boolean;
  idempotencyKey?: string;
}): Promise<TuitionInvoice | null> {
  const orgId = getOrganizationId();
  if (!isSupabaseConfigured() || !orgId) {
    return StorageService.recordPayment(
      params.invoiceId,
      params.amount,
      params.method,
      params.notes,
      params.paymentDate,
      { cashReceiptIssued: params.cashReceiptIssued }
    );
  }

  const existing = StorageService.getInvoices().find((i) => i.id === params.invoiceId);
  const client = getCoreClient();
  const key = params.idempotencyKey || newPaymentIdempotencyKey();
  const { data, error } = await client.rpc('record_tuition_payment_idempotent' as never, {
    p_organization_id: orgId,
    p_invoice_id: params.invoiceId,
    p_amount: params.amount,
    p_payment_method: APP_TO_DB[params.method] || 'cash',
    p_paid_at: params.paymentDate || todayIsoLocal(),
    p_memo: params.notes ?? null,
    p_cash_receipt_issued: params.cashReceiptIssued === true,
    p_idempotency_key: key,
  } as never);

  if (error) {
    const message = error.message || '수강료 수납에 실패했습니다.';
    if (message.includes('Invoice already paid') || message.includes('Invalid payment amount')) {
      return existing || null;
    }
    throw new Error(message);
  }

  const payload = data as {
    action?: string;
    invoice?: InvoiceRow;
    transaction?: TxRow;
  } | null;
  if (!payload?.invoice) {
    throw new Error('수강료 수납 응답이 비어 있습니다.');
  }

  const invoice = paymentRowToInvoice(payload.invoice);
  const lookup = new Map([
    [invoice.id, { studentId: invoice.studentId, studentName: invoice.studentName, yearMonth: invoice.yearMonth }],
  ]);
  const tx = payload.transaction
    ? transactionRowToTuitionPayment(payload.transaction, lookup)
    : undefined;

  writeInvoiceMirror(invoice);
  if (tx) {
    writeTuitionPaymentMirror(tx);
    upsertLinkedIncome({
      sourceType: 'tuition',
      paymentId: tx.id,
      date: tx.paymentDate,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      description: `${invoice.yearMonth} 수강료 · ${invoice.studentName}`,
      payer: invoice.studentName,
      memo: params.notes,
    });
    if (invoice.status === 'paid' && (invoice.linkedTextbookSaleIds || []).length > 0) {
      void settleLinkedTextbookSalesOnTuitionPaid({
        api: StorageService,
        invoice,
        paymentId: tx.id,
        method: params.method,
        paymentDate: tx.paymentDate,
      }).catch((err) => console.error('[recordTuitionPaymentAtomic] linked textbook settle', err));
    }
  }
  return invoice;
}

export async function ensureMonthlyTuitionInvoiceAtomic(params: {
  studentId: string;
  studentName: string;
  yearMonth: string;
  title: string;
  billedAmount: number;
  dueDate?: string;
  metadata?: Record<string, unknown>;
  invoiceId?: string;
}): Promise<TuitionInvoice | null> {
  const orgId = getOrganizationId();
  if (!isSupabaseConfigured() || !orgId) return null;

  const client = getCoreClient();
  const { data, error } = await client.rpc('ensure_monthly_tuition_invoice' as never, {
    p_organization_id: orgId,
    p_customer_id: params.studentId,
    p_year_month: params.yearMonth,
    p_title: params.title,
    p_billed_amount: params.billedAmount,
    p_due_date: params.dueDate || null,
    p_metadata: {
      studentName: params.studentName,
      yearMonth: params.yearMonth,
      ...(params.metadata || {}),
    } as unknown as Json,
    p_invoice_id: params.invoiceId || null,
  } as never);

  if (error) throw new Error(error.message || '청구서 생성에 실패했습니다.');
  const payload = data as { invoice?: InvoiceRow } | null;
  if (!payload?.invoice) return null;
  const invoice = paymentRowToInvoice(payload.invoice);
  writeInvoiceMirror(invoice);
  return invoice;
}

/** 동시 부분 수납 모델 — lock 후 remaining으로 clip 하면 billed를 넘지 않는다 */
export { modelSerializedTuitionPayments } from './tuitionPaymentPlan';
