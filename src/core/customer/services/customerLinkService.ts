import { getCoreClient } from '@/lib/supabase';

export type CustomerLinkStatus = 'linked' | 'already_linked';

export interface CustomerLinkResult {
  status: CustomerLinkStatus;
  customerId: string;
  organizationId: string;
  userId?: string;
}

export interface EnsureGuestCustomerParams {
  organizationId: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  /** walk_in | phone_booking | reservation 등 */
  source?: string;
}

/**
 * Customer ↔ User 분리.
 * - 비회원 Customer: user_id NULL (전화 예약·원 등록)
 * - 회원 연동: linkCustomerToCurrentUser
 */
export const customerLinkService = {
  /** 스태프용 — 앱 없이 전화로 등록된 비회원 Customer 확보 */
  async ensureGuestCustomer(params: EnsureGuestCustomerParams): Promise<string> {
    const { data, error } = await getCoreClient().rpc('ensure_guest_customer' as never, {
      p_org_id: params.organizationId,
      p_name: params.name,
      p_phone: params.phone ?? null,
      p_email: params.email ?? null,
      p_source: params.source ?? 'walk_in',
    } as never);

    if (error) {
      if (error.message.includes('Not allowed')) {
        throw new Error('비회원 고객을 등록할 권한이 없습니다.');
      }
      if (error.message.includes('name is required')) {
        throw new Error('고객 이름을 입력해 주세요.');
      }
      throw new Error(error.message || '비회원 고객 등록에 실패했습니다.');
    }

    return data as string;
  },

  /**
   * 비회원 Customer를 현재 로그인 User에 연결.
   * 전화 확인(p_expected_phone)으로 가로채기를 막는다.
   */
  async linkCustomerToCurrentUser(
    customerId: string,
    expectedPhone?: string | null
  ): Promise<CustomerLinkResult> {
    const { data, error } = await getCoreClient().rpc('link_customer_to_current_user' as never, {
      p_customer_id: customerId,
      p_expected_phone: expectedPhone ?? null,
    } as never);

    if (error) {
      if (error.message.includes('already linked to another user')) {
        throw new Error('이미 다른 계정에 연결된 고객입니다.');
      }
      if (error.message.includes('Phone does not match')) {
        throw new Error('전화번호가 고객 기록과 일치하지 않습니다.');
      }
      if (error.message.includes('already linked to another customer')) {
        throw new Error('이 계정은 이미 이 사업장의 다른 고객과 연결되어 있습니다.');
      }
      throw new Error(error.message || '고객 계정 연결에 실패했습니다.');
    }

    const row = (typeof data === 'string' ? JSON.parse(data) : data) as {
      status: CustomerLinkStatus;
      customer_id: string;
      organization_id: string;
      user_id?: string;
    };

    return {
      status: row.status,
      customerId: row.customer_id,
      organizationId: row.organization_id,
      userId: row.user_id,
    };
  },

  /** 조직에서 내 user_id로 연결된 Customer (없으면 null) */
  async findMyLinkedCustomer(organizationId: string): Promise<{ id: string; name: string } | null> {
    const { data, error } = await getCoreClient()
      .from('customers')
      .select('id, name, user_id')
      .eq('organization_id', organizationId)
      .not('user_id', 'is', null)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    return { id: data.id, name: data.name };
  },
};
