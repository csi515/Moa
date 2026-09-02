import type { TextbookSale } from '../../../../types';
import type { PaymentMethod as DbPaymentMethod, PianoTextbookPaymentStatus } from '../../../../lib/supabase/database.types';

export interface SaleMetadata {
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  textbookTitle?: string;
  studentName?: string;
  teacherName?: string;
}

export const SALE_STATUS_TO_DB: Record<TextbookSale['status'], PianoTextbookPaymentStatus> = {
  unpaid: 'unpaid',
  partial: 'partial',
  paid: 'paid',
};

export const DB_TO_SALE_STATUS: Record<PianoTextbookPaymentStatus, TextbookSale['status']> = {
  unpaid: 'unpaid',
  partial: 'partial',
  paid: 'paid',
};

export const APP_TO_DB_PAYMENT: Record<string, DbPaymentMethod> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
};
