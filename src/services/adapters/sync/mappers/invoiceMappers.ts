import type { TuitionInvoice } from '../../../../types';
import type { Json, PaymentMethod as DbPaymentMethod, PaymentStatus } from '../../../../lib/supabase/database.types';
import { packInvoicePaymentMetadata, unpackInvoicePaymentMetadata } from './invoiceMetadata';

const INVOICE_STATUS_MAP: Record<TuitionInvoice['status'], PaymentStatus> = {
  paid: 'paid',
  partial: 'partial',
  unpaid: 'unpaid',
  overdue: 'unpaid',
  cancelled: 'cancelled',
};

const APP_PAYMENT_METHOD_MAP: Record<string, DbPaymentMethod> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
  local_currency: 'local_currency',
  onsite_card: 'onsite_card',
};

export function invoiceToPaymentRow(inv: TuitionInvoice, organizationId: string) {
  return {
    id: inv.id,
    organization_id: organizationId,
    customer_id: inv.studentId,
    title: inv.title || `${inv.yearMonth} 수강료`,
    billed_amount: inv.totalAmount,
    paid_amount: inv.paidAmount,
    due_date: inv.dueDate || null,
    status: INVOICE_STATUS_MAP[inv.status] || 'unpaid',
    payment_method: inv.paymentMethod
      ? APP_PAYMENT_METHOD_MAP[inv.paymentMethod] || 'other'
      : null,
    paid_at: inv.paidAt || inv.paidDate || null,
    receipt_number: inv.receiptNumber || null,
    memo: inv.notes || null,
    sent_at: inv.sentAt || null,
    metadata: packInvoicePaymentMetadata(inv) as unknown as Json,
  };
}

export function paymentRowToInvoice(row: {
  id: string;
  customer_id: string;
  title: string;
  billed_amount: number;
  paid_amount: number;
  due_date: string | null;
  status: PaymentStatus;
  payment_method: DbPaymentMethod | null;
  paid_at: string | null;
  receipt_number: string | null;
  memo: string | null;
  metadata: Json;
  sent_at?: string | null;
}): TuitionInvoice {
  const meta = unpackInvoicePaymentMetadata(row.metadata);
  const yearMonth = meta.yearMonth || row.title.replace(' 수강료', '');
  const unpaidAmount = meta.unpaidAmount ?? Math.max(0, row.billed_amount - row.paid_amount);

  let status: TuitionInvoice['status'] = 'unpaid';
  if (row.status === 'paid') status = 'paid';
  else if (row.status === 'partial') status = 'partial';
  else if (row.status === 'cancelled') status = 'cancelled';
  else if (row.due_date && new Date(row.due_date) < new Date() && row.paid_amount < row.billed_amount) {
    status = 'overdue';
  }

  const methodReverse: Record<string, TuitionInvoice['paymentMethod']> = {
    card: 'card',
    transfer: 'transfer',
    cash: 'cash',
    other: 'other',
    online: 'other',
    local_currency: 'local_currency',
    onsite_card: 'onsite_card',
  };

  return {
    id: row.id,
    studentId: row.customer_id,
    studentName: meta.studentName,
    yearMonth,
    title: row.title || undefined,
    baseTuition: meta.baseTuition,
    baseFee: meta.baseFee,
    discount: meta.discount,
    discountAmount: meta.discountAmount,
    textbookFee: meta.textbookFee,
    additionalAmount: meta.additionalAmount,
    extraFee: meta.extraFee,
    extraFeeLabel: meta.extraFeeLabel,
    totalAmount: row.billed_amount,
    paidAmount: row.paid_amount,
    unpaidAmount,
    dueDate: row.due_date || '',
    status,
    paymentMethod: row.payment_method ? methodReverse[row.payment_method] : null,
    paidAt: row.paid_at || undefined,
    paidDate: row.paid_at?.slice(0, 10),
    notes: meta.notes || row.memo || undefined,
    receiptNumber: row.receipt_number || undefined,
    includeExtras: meta.includeExtras,
    linkedTextbookSaleIds: meta.linkedTextbookSaleIds,
    linkedExtraItems: meta.linkedExtraItems,
    invoiceSent: meta.invoiceSent,
    sentAt: row.sent_at ?? undefined,
    cashReceiptRequested: meta.cashReceiptRequested,
  };
}
