import type { Json } from '@/lib/supabase/database.types';
import type { FinanceExpense, IncomeEntry } from '@/core/finance/types';
import type { Expense } from '@/types';

type DbPaymentMethod = 'cash' | 'card' | 'transfer' | 'other' | 'online';

const APP_TO_DB_PAYMENT: Record<string, DbPaymentMethod> = {
  cash: 'cash',
  card: 'card',
  transfer: 'transfer',
  other: 'other',
};

const DB_TO_APP_PAYMENT: Record<string, Expense['paymentMethod']> = {
  card: 'card',
  transfer: 'transfer',
  cash: 'cash',
  other: 'other',
  online: 'other',
};

export function expenseToCoreRow(expense: FinanceExpense | Expense, organizationId: string) {
  return {
    id: expense.id,
    organization_id: organizationId,
    expense_date: expense.date,
    category: expense.category,
    amount: expense.amount,
    payment_method: APP_TO_DB_PAYMENT[expense.paymentMethod] || 'cash',
    description: expense.description,
    recipient: expense.recipient || null,
    vendor: expense.vendor || null,
    memo: expense.memo || null,
    receipt_memo: expense.receiptMemo || null,
    metadata: {} as Json,
  };
}

export function coreRowToExpense(row: {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  payment_method: DbPaymentMethod;
  description: string;
  recipient: string | null;
  vendor: string | null;
  memo: string | null;
  receipt_memo: string | null;
}): FinanceExpense {
  return {
    id: row.id,
    date: row.expense_date,
    category: row.category,
    amount: Number(row.amount),
    paymentMethod: DB_TO_APP_PAYMENT[row.payment_method] || 'cash',
    description: row.description,
    recipient: row.recipient || undefined,
    vendor: row.vendor || undefined,
    memo: row.memo || undefined,
    receiptMemo: row.receipt_memo || undefined,
  };
}

export function incomeToCoreRow(entry: IncomeEntry, organizationId: string) {
  return {
    id: entry.id,
    organization_id: organizationId,
    income_date: entry.date,
    category: entry.category,
    amount: entry.amount,
    payment_method: APP_TO_DB_PAYMENT[entry.paymentMethod] || 'cash',
    description: entry.description,
    payer: entry.payer || null,
    memo: entry.memo || null,
    source_type: entry.sourceType || 'manual',
    source_id: entry.sourceId || null,
    metadata: {} as Json,
  };
}

export function coreRowToIncome(row: {
  id: string;
  income_date: string;
  category: string;
  amount: number;
  payment_method: DbPaymentMethod;
  description: string;
  payer: string | null;
  memo: string | null;
  source_type: string;
  source_id: string | null;
}): IncomeEntry {
  return {
    id: row.id,
    date: row.income_date,
    category: row.category,
    amount: Number(row.amount),
    paymentMethod: DB_TO_APP_PAYMENT[row.payment_method] || 'cash',
    description: row.description,
    payer: row.payer || undefined,
    memo: row.memo || undefined,
    sourceType: (row.source_type as IncomeEntry['sourceType']) || 'manual',
    sourceId: row.source_id || undefined,
  };
}
