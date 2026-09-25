/**
 * core.payments.metadata JSON.
 * 컬럼으로 올리지 않는 청구 분해·연결·발송 플래그만 담는다.
 */
import type { TuitionInvoice } from '@/types';

export type InvoicePaymentMetadata = {
  studentName: string;
  yearMonth: string;
  baseTuition?: number;
  baseFee?: number;
  discount?: number;
  discountAmount?: number;
  textbookFee?: number;
  additionalAmount?: number;
  extraFee?: number;
  extraFeeLabel?: string;
  unpaidAmount?: number;
  notes?: string;
  includeExtras?: boolean;
  linkedTextbookSaleIds?: string[];
  linkedExtraItems?: TuitionInvoice['linkedExtraItems'];
  invoiceSent?: boolean;
  cashReceiptRequested?: boolean;
};

export function packInvoicePaymentMetadata(inv: TuitionInvoice): InvoicePaymentMetadata {
  return {
    studentName: inv.studentName,
    yearMonth: inv.yearMonth,
    baseTuition: inv.baseTuition ?? inv.baseFee,
    baseFee: inv.baseFee,
    discount: inv.discount,
    discountAmount: inv.discountAmount,
    textbookFee: inv.textbookFee,
    additionalAmount: inv.additionalAmount,
    extraFee: inv.extraFee,
    extraFeeLabel: inv.extraFeeLabel,
    unpaidAmount: inv.unpaidAmount,
    notes: inv.notes,
    includeExtras: inv.includeExtras,
    linkedTextbookSaleIds: inv.linkedTextbookSaleIds,
    linkedExtraItems: inv.linkedExtraItems,
    invoiceSent: inv.invoiceSent,
    cashReceiptRequested: inv.cashReceiptRequested,
  };
}

export function unpackInvoicePaymentMetadata(raw: unknown): InvoicePaymentMetadata {
  const meta = (raw && typeof raw === 'object' ? raw : {}) as InvoicePaymentMetadata;
  return {
    studentName: meta.studentName || '',
    yearMonth: meta.yearMonth || '',
    baseTuition: meta.baseTuition,
    baseFee: meta.baseFee,
    discount: meta.discount,
    discountAmount: meta.discountAmount,
    textbookFee: meta.textbookFee,
    additionalAmount: meta.additionalAmount,
    extraFee: meta.extraFee,
    extraFeeLabel: meta.extraFeeLabel,
    unpaidAmount: meta.unpaidAmount,
    notes: meta.notes,
    includeExtras: meta.includeExtras,
    linkedTextbookSaleIds: meta.linkedTextbookSaleIds,
    linkedExtraItems: meta.linkedExtraItems,
    invoiceSent: meta.invoiceSent,
    cashReceiptRequested: meta.cashReceiptRequested,
  };
}
