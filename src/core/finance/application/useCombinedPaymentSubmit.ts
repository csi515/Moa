import { useRef, useState } from 'react';
import type { CombinedPaymentRequest } from '@/types';
import { useApp } from '@/context/AppContext';
import { recordCombinedPayment } from './recordCombinedPayment';
import { runCombinedPaymentSubmit } from './combinedPaymentSubmit';

/** React 입력과 통합 수납 command 실행을 연결한다. */
export function useCombinedPaymentSubmit(params: {
  studentName: string;
  customerLabel: string;
  onSuccess: () => void;
}) {
  const { showToast, triggerRefresh } = useApp();
  const busy = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (request: CombinedPaymentRequest | null) => {
    setSubmitting(true);
    try {
      await runCombinedPaymentSubmit({
        busy,
        request,
        execute: recordCombinedPayment,
        showToast,
        triggerRefresh,
        onSuccess: params.onSuccess,
        studentName: params.studentName,
        customerLabel: params.customerLabel,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting };
}
