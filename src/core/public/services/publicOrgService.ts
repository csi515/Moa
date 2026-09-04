import { supabase } from '@/lib/supabase/client';
import type { PublicOrgInfo, ConsultationSubmission } from '@/types';

/**
 * Public organization discovery service
 * These functions can be called without authentication
 */

export const publicOrgService = {
  /**
   * Search public organizations by name, code, or address
   */
  async searchOrganizations(query: string, industryType?: string): Promise<PublicOrgInfo[]> {
    const { data, error } = await supabase.rpc('search_public_organizations', {
      p_query: query,
      p_industry_type: industryType || null,
      p_limit: 20,
    });

    if (error) {
      console.error('Failed to search organizations:', error);
      throw new Error('조직 검색에 실패했습니다');
    }

    return data || [];
  },

  /**
   * Get organization details by public code
   */
  async getOrganizationByCode(code: string): Promise<PublicOrgInfo | null> {
    const { data, error } = await supabase.rpc('get_public_organization_by_code', {
      p_code: code.toUpperCase(),
    });

    if (error) {
      console.error('Failed to fetch organization:', error);
      throw new Error('조직 정보를 가져오는데 실패했습니다');
    }

    return data?.[0] || null;
  },

  /**
   * Submit consultation request (no auth required)
   */
  async submitConsultation(
    orgId: string,
    submission: ConsultationSubmission
  ): Promise<string> {
    const { data, error } = await supabase.rpc('submit_public_consultation', {
      p_org_id: orgId,
      p_contact_name: submission.contact_name,
      p_contact_phone: submission.contact_phone,
      p_message: submission.message,
      p_preferred_time: submission.preferred_time || null,
    });

    if (error) {
      console.error('Failed to submit consultation:', error);
      throw new Error('상담 신청에 실패했습니다');
    }

    return data;
  },
};
