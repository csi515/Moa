import type { TuitionInvoice, TuitionPayment } from '../../../types';
import { writeLocal } from '../localStorageEngine';
import { STORAGE_KEYS } from '../storageKeys';
import { invoiceToPaymentRow } from './entityMappers';
import {
  expenseToCoreRow,
  incomeToCoreRow,
  tuitionPaymentToTransactionRow,
} from './financeEntityMappers';
import type { FinanceExpense, IncomeEntry } from '../../../core/finance/types';
import type { PersistAbortGuard, SyncCache } from './syncTypes';
import { requireCacheList } from './persistHelpers';
import type { CoreClient } from './corePersistSyncTable';
import { syncTable } from './corePersistSyncTable';

export async function persistPayments(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const invoices = requireCacheList<TuitionInvoice>(cache, STORAGE_KEYS.INVOICES, 'payments');
  if (!invoices) return;

  await syncTable(
    client,
    'payments',
    orgId,
    invoices.map((i) => i.id),
    async () => {
      for (const inv of invoices) {
        if (isAborted()) return;
        const { error } = await client.from('payments').upsert(invoiceToPaymentRow(inv, orgId));
        if (error) console.error('Failed to upsert payment:', error);
      }
    },
    { cachePresent: true, context: 'payments', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.INVOICES, invoices);
}

export async function persistTuitionPayments(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  // payment_transactions.payment_id → payments.id FK
  await persistPayments(client, orgId, cache, isAborted);
  if (isAborted()) return;

  const payments = requireCacheList<TuitionPayment>(
    cache,
    STORAGE_KEYS.TUITION_PAYMENTS,
    'payment_transactions'
  );
  if (!payments) return;

  await syncTable(
    client,
    'payment_transactions',
    orgId,
    payments.map((p) => p.id),
    async () => {
      for (const payment of payments) {
        if (isAborted()) return;
        const { error } = await client
          .from('payment_transactions')
          .upsert(tuitionPaymentToTransactionRow(payment, orgId));
        if (error) console.error('Failed to upsert payment_transaction:', error);
      }
    },
    { cachePresent: true, context: 'payment_transactions', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.TUITION_PAYMENTS, payments);
}

export async function persistExpenses(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const expenses = requireCacheList<FinanceExpense>(cache, STORAGE_KEYS.EXPENSES, 'expenses');
  if (!expenses) return;

  await syncTable(
    client,
    'expenses',
    orgId,
    expenses.map((e) => e.id),
    async () => {
      for (const expense of expenses) {
        if (isAborted()) return;
        const { error } = await client.from('expenses').upsert(expenseToCoreRow(expense, orgId));
        if (error) console.error('Failed to upsert expense:', error);
      }
    },
    { cachePresent: true, context: 'expenses', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.EXPENSES, expenses);
}

export async function persistIncomeEntries(
  client: CoreClient,
  orgId: string,
  cache: SyncCache,
  isAborted: PersistAbortGuard
): Promise<void> {
  if (isAborted()) return;
  const entries = requireCacheList<IncomeEntry>(cache, STORAGE_KEYS.INCOME_ENTRIES, 'income_entries');
  if (!entries) return;

  await syncTable(
    client,
    'income_entries',
    orgId,
    entries.map((e) => e.id),
    async () => {
      for (const entry of entries) {
        if (isAborted()) return;
        const { error } = await client.from('income_entries').upsert(incomeToCoreRow(entry, orgId));
        if (error) console.error('Failed to upsert income entry:', error);
      }
    },
    { cachePresent: true, context: 'income_entries', isAborted }
  );

  if (isAborted()) return;
  writeLocal(STORAGE_KEYS.INCOME_ENTRIES, entries);
}
