import type {
  AttendanceRecord,
  AcademyEvent,
  Expense,
  LessonRecord,
  PerformanceVideo,
  PracticeRecord,
  Song,
  Student,
  Textbook,
  TextbookInventoryTransaction,
  TextbookPayment,
  TextbookSale,
} from '../../../../types';
import type {
  Json,
  PaymentMethod as DbPaymentMethod,
  PianoAttendanceStatus,
  PianoInventoryTransactionType,
  PianoTextbookPaymentStatus,
} from '../../../../lib/supabase/database.types';
import {
  APP_TO_DB_PAYMENT,
  DB_TO_SALE_STATUS,
  SALE_STATUS_TO_DB,
  type SaleMetadata,
} from './shared';

// ─── Textbook Sales ───────────────────────────────────────────────

export function saleToPianoRow(sale: TextbookSale, organizationId: string) {
  const metadata: SaleMetadata = {
    textbookTitle: sale.textbookTitle,
    studentName: sale.studentName,
    teacherName: sale.teacherName,
  };

  return {
    id: sale.id,
    organization_id: organizationId,
    customer_id: sale.studentId,
    textbook_id: sale.textbookId,
    sale_date: sale.saleDate,
    quantity: sale.quantity,
    unit_price: sale.unitPrice,
    discount: sale.discount,
    total_amount: sale.totalAmount,
    paid_amount: sale.paidAmount,
    status: SALE_STATUS_TO_DB[sale.status],
    payment_method: sale.paymentMethod
      ? APP_TO_DB_PAYMENT[sale.paymentMethod] || 'other'
      : null,
    memo: sale.memo || null,
    staff_id: sale.teacherId || null,
    metadata: metadata as Json,
  };
}

export function pianoRowToSale(row: {
  id: string;
  customer_id: string;
  textbook_id: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  status: PianoTextbookPaymentStatus;
  payment_method: DbPaymentMethod | null;
  memo: string | null;
  staff_id: string | null;
  metadata: Json;
  created_at: string;
  updated_at: string;
}): TextbookSale {
  const meta = (row.metadata || {}) as SaleMetadata;
  const methodReverse: Record<string, TextbookSale['paymentMethod']> = {
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
    parentId: meta.parentId,
    parentName: meta.parentName || '',
    parentPhone: meta.parentPhone || '',
    textbookId: row.textbook_id,
    textbookTitle: meta.textbookTitle || '',
    saleDate: row.sale_date,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    discount: row.discount,
    totalAmount: row.total_amount,
    paidAmount: row.paid_amount,
    unpaidAmount: Math.max(0, row.total_amount - row.paid_amount),
    status: DB_TO_SALE_STATUS[row.status],
    paymentMethod: row.payment_method ? methodReverse[row.payment_method] : null,
    memo: row.memo || undefined,
    teacherId: row.staff_id || undefined,
    teacherName: meta.teacherName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

