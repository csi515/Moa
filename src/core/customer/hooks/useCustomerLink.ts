import { useCallback, useState } from 'react';
import {
  customerLinkService,
  type CustomerLinkResult,
  type EnsureGuestCustomerParams,
} from '../services/customerLinkService';

/** 비회원 Customer 생성·User 연동 */
export function useCustomerLink() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensureGuest = useCallback(async (params: EnsureGuestCustomerParams) => {
    setLoading(true);
    setError(null);
    try {
      return await customerLinkService.ensureGuestCustomer(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : '비회원 고객 등록에 실패했습니다.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const linkToUser = useCallback(
    async (customerId: string, expectedPhone?: string | null): Promise<CustomerLinkResult> => {
      setLoading(true);
      setError(null);
      try {
        return await customerLinkService.linkCustomerToCurrentUser(customerId, expectedPhone);
      } catch (err) {
        const message = err instanceof Error ? err.message : '고객 계정 연결에 실패했습니다.';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { ensureGuest, linkToUser, loading, error };
}
