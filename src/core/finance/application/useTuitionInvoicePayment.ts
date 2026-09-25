import { useRef, useState } from 'react';
import type { PaymentMethod, TuitionInvoice } from '@/types';
import { useApp } from '@/context/AppContext';
import { TuitionService } from '@/core/finance/services/tuitionService';
import { runTuitionInvoicePayment } from './submitTuitionInvoicePayment';

/** 단일 청구서 수납의 요청 상태와 toast만 담당한다. */
export function useTuitionInvoicePayment(customerLabel: string) {
  const { showToast } = useApp();
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (params: {
    invoice: TuitionInvoice | null;
    amount: number;
    method: PaymentMethod;
    memo?: string;
    paymentDate?: string;
    cashReceiptIssued?: boolean;
  }): Promise<boolean> => {
    setSubmitting(true);
    try {
      const result = await runTuitionInvoicePayment({
        busy,
        customerLabel,
        recordPayment: (invoiceId, amount, method, notes, paymentDate, options) =>
          TuitionService.recordPayment(invoiceId, amount, method, notes, paymentDate, options),
        ...params,
      });
      if ('skipped' in result && result.skipped) return false;
      if (!result.ok) {
        showToast(result.message, result.toast);
        return false;
      }
      showToast(result.message, 'success');
      return true;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting };
}
