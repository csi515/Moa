import { supabase } from '@/lib/supabase/client';
import type { CustomerJoinRequest, JoinRequestType } from '@/types';

export interface SubmitJoinRequestParams {
  orgId: string;
  applicantName: string;
  applicantPhone?: string;
  applicantEmail?: string;
  requestType?: JoinRequestType;
  message?: string;
  customerMetadata?: Record<string, unknown>;
}

export const customerJoinService = {
  /**
   * Submit a customer join request
   */
  async submitJoinRequest(params: SubmitJoinRequestParams): Promise<string> {
    const { data, error } = await supabase.rpc('submit_customer_join_request', {
      p_org_id: params.orgId,
      p_applicant_name: params.applicantName,
      p_applicant_phone: params.applicantPhone || null,
      p_applicant_email: params.applicantEmail || null,
      p_request_type: params.requestType || 'membership',
      p_message: params.message || null,
      p_customer_metadata: params.customerMetadata || null,
    });

    if (error) {
      console.error('Failed to submit join request:', error);
      if (error.message.includes('already a member')) {
        throw new Error('이미 해당 조직의 회원입니다');
      } else if (error.message.includes('pending request')) {
        throw new Error('이미 가입 신청이 진행 중입니다');
      }
      throw new Error('가입 신청에 실패했습니다');
    }

    return data;
  },

  /**
   * Get user's join requests
   */
  async getMyJoinRequests(): Promise<CustomerJoinRequest[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('customer_join_requests')
      .select('*')
      .eq('applicant_user_id', user.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch join requests:', error);
      throw new Error('가입 신청 목록을 가져오는데 실패했습니다');
    }

    return data || [];
  },

  /**
   * Get pending join requests for an organization (owner/admin only)
   */
  async getOrgJoinRequests(orgId: string, status?: string): Promise<CustomerJoinRequest[]> {
    let query = supabase
      .from('customer_join_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch organization join requests:', error);
      throw new Error('가입 신청 목록을 가져오는데 실패했습니다');
    }

    return data || [];
  },

  /**
   * Approve a join request (owner/admin only)
   */
  async approveJoinRequest(requestId: string, role: 'customer' | 'member' = 'customer'): Promise<void> {
    const { error } = await supabase.rpc('approve_customer_join_request', {
      p_request_id: requestId,
      p_role: role,
    });

    if (error) {
      console.error('Failed to approve join request:', error);
      throw new Error('가입 승인에 실패했습니다');
    }
  },

  /**
   * Reject a join request (owner/admin only)
   */
  async rejectJoinRequest(requestId: string, reason?: string): Promise<void> {
    const { error } = await supabase.rpc('reject_customer_join_request', {
      p_request_id: requestId,
      p_reject_reason: reason || null,
    });

    if (error) {
      console.error('Failed to reject join request:', error);
      throw new Error('가입 반려에 실패했습니다');
    }
  },
};
