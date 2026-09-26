import { createFinanceInvoicePersist } from '@/services/storage/financeInvoicePersist';
import { createFinanceStorage } from '@/services/storage/financeStorage';
import { createInvoicePaymentService } from '@/core/finance/services/invoicePaymentService';
import type { StorageApi } from '@/services/storage/helpers';

/** Billing persistence facade. 기존 finance/invoice factory를 연결한다. */
export function createBillingCapabilityStorage(api: StorageApi) {
  return {
    ...createFinanceStorage(api),
    ...createFinanceInvoicePersist(api),
    ...createInvoicePaymentService(api),
  };
}

export type BillingCapabilityStorage = ReturnType<typeof createBillingCapabilityStorage>;
