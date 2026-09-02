import type {
  AppNotification,
  AttendanceRecord,
  ClassItem,
  Consultation,
  Parent,
  Student,
  TuitionInvoice,
} from '../../../../types';
import type { Json, PaymentMethod as DbPaymentMethod, PaymentStatus } from '../../../../lib/supabase/database.types';
import type { StaffMetadata } from '../../types';
import type { AcademySettings, Teacher } from '../../../../types';
import type { Booking, ServiceOffering } from '../../../../core/types/schedule';
import type { PickupAddress } from '../../../../core/transport/types';


// ─── Payments (Invoices) ──────────────────────────────────────────

interface PaymentMetadata {
  studentName: string;
  yearMonth: string;
  baseTuition?: number;
  baseFee?: number;
  discount?: number;
  discountAmount?: number;
  textbookFee?: number;
  additionalAmount?: number;
  extraFee?: number;
  unpaidAmount?: number;
  notes?: string;
}

const INVOICE_STATUS_MAP: Record<TuitionInvoice['status'], PaymentStatus> = {
  paid: 'paid',
  partial: 'partial',
  unpaid: 'unpaid',
  overdue: 'unpaid',
};

const APP_PAYMENT_METHOD_MAP: Record<string, DbPaymentMethod> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
};

export function invoiceToPaymentRow(inv: TuitionInvoice, organizationId: string) {
  const metadata: PaymentMetadata = {
    studentName: inv.studentName,
    yearMonth: inv.yearMonth,
    baseTuition: inv.baseTuition ?? inv.baseFee,
    baseFee: inv.baseFee,
    discount: inv.discount,
    discountAmount: inv.discountAmount,
    textbookFee: inv.textbookFee,
    additionalAmount: inv.additionalAmount,
    extraFee: inv.extraFee,
    unpaidAmount: inv.unpaidAmount,
    notes: inv.notes,
  };

  return {
    id: inv.id,
    organization_id: organizationId,
    customer_id: inv.studentId,
    title: `${inv.yearMonth} 수강료`,
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
    metadata: metadata as unknown as Json,
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
}): TuitionInvoice {
  const meta = (row.metadata || {}) as unknown as PaymentMetadata;
  const yearMonth = meta.yearMonth || row.title.replace(' 수강료', '');
  const unpaidAmount = meta.unpaidAmount ?? Math.max(0, row.billed_amount - row.paid_amount);

  let status: TuitionInvoice['status'] = 'unpaid';
  if (row.status === 'paid') status = 'paid';
  else if (row.status === 'partial') status = 'partial';
  else if (row.due_date && new Date(row.due_date) < new Date() && row.paid_amount < row.billed_amount) {
    status = 'overdue';
  }

  const methodReverse: Record<string, TuitionInvoice['paymentMethod']> = {
    card: 'card',
    transfer: 'transfer',
    cash: 'cash',
    other: 'other',
    online: 'other',
  };

  return {
    id: row.id,
    studentId: row.customer_id,
    studentName: meta.studentName || '',
    yearMonth,
    baseTuition: meta.baseTuition,
    baseFee: meta.baseFee,
    discount: meta.discount,
    discountAmount: meta.discountAmount,
    textbookFee: meta.textbookFee,
    additionalAmount: meta.additionalAmount,
    extraFee: meta.extraFee,
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
  };
}

