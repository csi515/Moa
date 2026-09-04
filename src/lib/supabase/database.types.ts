/**
 * Core schema types for Supabase multi-tenant SaaS platform.
 * Regenerate with: npm run supabase:types
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MemberRole = 
  | 'owner' 
  | 'admin' 
  | 'manager' 
  | 'staff' 
  | 'parent' 
  | 'instructor' 
  | 'member' 
  | 'customer' 
  | 'guardian';
export type ScheduleStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'online' | 'other';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type NotificationChannel = 'app' | 'email' | 'sms' | 'kakao';
export type CheckInMethod = 'pin' | 'qr' | 'nfc' | 'kiosk' | 'manual';
export type GuardianRelationship = 'father' | 'mother' | 'other';
export type CareJournalMood = 'good' | 'normal' | 'tired' | 'sick';
export type MedicationStatus = 'requested' | 'administered' | 'cancelled';
export type CurriculumProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type AssignmentStatus = 'assigned' | 'in_progress' | 'submitted' | 'reviewed';
export type AchievementType =
  | 'exam'
  | 'competition'
  | 'certificate'
  | 'grade'
  | 'recital'
  | 'other';
export type LearningReportStatus = 'draft' | 'published' | 'archived';

export interface Database {
  core: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          industry_type: string;
          slug: string | null;
          settings: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry_type?: string;
          slug?: string | null;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry_type?: string;
          slug?: string | null;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: MemberRole;
          staff_id: string | null;
          parent_customer_id: string | null;
          is_active: boolean;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: MemberRole;
          staff_id?: string | null;
          parent_customer_id?: string | null;
          is_active?: boolean;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: MemberRole;
          staff_id?: string | null;
          parent_customer_id?: string | null;
          is_active?: boolean;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'organization_members_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'organization_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      parent_student_links: {
        Row: {
          organization_id: string;
          parent_customer_id: string;
          student_customer_id: string;
          relationship: GuardianRelationship;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          parent_customer_id: string;
          student_customer_id: string;
          relationship?: GuardianRelationship;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['core']['Tables']['parent_student_links']['Insert']>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          status: string;
          metadata: Json;
          memo: string | null;
          check_in_pin_hash: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          status?: string;
          metadata?: Json;
          memo?: string | null;
          check_in_pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          status?: string;
          metadata?: Json;
          memo?: string | null;
          check_in_pin_hash?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_organization_id_fkey';
            columns: ['organization_id'];
            referencedRelation: 'organizations';
            referencedColumns: ['id'];
          },
        ];
      };
      attendance_sessions: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          session_date: string;
          check_in_at: string | null;
          check_out_at: string | null;
          check_in_method: CheckInMethod | null;
          check_out_method: CheckInMethod | null;
          memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          session_date: string;
          check_in_at?: string | null;
          check_out_at?: string | null;
          check_in_method?: CheckInMethod | null;
          check_out_method?: CheckInMethod | null;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['core']['Tables']['attendance_sessions']['Insert']>;
        Relationships: [];
      };
      care_journals: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          journal_date: string;
          mood: CareJournalMood;
          meals: string;
          nap: string;
          activities: string;
          bowel: string | null;
          health_note: string | null;
          teacher_note: string;
          staff_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          journal_date: string;
          mood?: CareJournalMood;
          meals?: string;
          nap?: string;
          activities?: string;
          bowel?: string | null;
          health_note?: string | null;
          teacher_note?: string;
          staff_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['core']['Tables']['care_journals']['Insert']>;
        Relationships: [];
      };
      medication_requests: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          request_date: string;
          medicine_name: string;
          dosage: string;
          times: string;
          reason: string;
          guardian_name: string | null;
          status: MedicationStatus;
          administered_at: string | null;
          administered_by: string | null;
          note: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          request_date: string;
          medicine_name: string;
          dosage?: string;
          times?: string;
          reason?: string;
          guardian_name?: string | null;
          status?: MedicationStatus;
          administered_at?: string | null;
          administered_by?: string | null;
          note?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['core']['Tables']['medication_requests']['Insert']>;
        Relationships: [];
      };
      customer_contacts: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          name: string;
          relationship: string | null;
          phone: string | null;
          email: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          name: string;
          relationship?: string | null;
          phone?: string | null;
          email?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          name?: string;
          relationship?: string | null;
          phone?: string | null;
          email?: string | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          name: string;
          phone: string | null;
          email: string | null;
          status: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          name: string;
          phone?: string | null;
          email?: string | null;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string | null;
          name?: string;
          phone?: string | null;
          email?: string | null;
          status?: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          price: number;
          duration_minutes: number;
          is_active: boolean;
          is_schedulable: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          price?: number;
          duration_minutes?: number;
          is_active?: boolean;
          is_schedulable?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          duration_minutes?: number;
          is_active?: boolean;
          is_schedulable?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      service_staff: {
        Row: {
          service_id: string;
          staff_id: string;
        };
        Insert: {
          service_id: string;
          staff_id: string;
        };
        Update: {
          service_id?: string;
          staff_id?: string;
        };
        Relationships: [];
      };
      schedules: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string | null;
          staff_id: string | null;
          service_id: string | null;
          starts_at: string;
          ends_at: string;
          status: ScheduleStatus;
          memo: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id?: string | null;
          staff_id?: string | null;
          service_id?: string | null;
          starts_at: string;
          ends_at: string;
          status?: ScheduleStatus;
          memo?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string | null;
          staff_id?: string | null;
          service_id?: string | null;
          starts_at?: string;
          ends_at?: string;
          status?: ScheduleStatus;
          memo?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          title: string;
          billed_amount: number;
          paid_amount: number;
          due_date: string | null;
          status: PaymentStatus;
          payment_method: PaymentMethod | null;
          paid_at: string | null;
          receipt_number: string | null;
          memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          title: string;
          billed_amount?: number;
          paid_amount?: number;
          due_date?: string | null;
          status?: PaymentStatus;
          payment_method?: PaymentMethod | null;
          paid_at?: string | null;
          receipt_number?: string | null;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          title?: string;
          billed_amount?: number;
          paid_amount?: number;
          due_date?: string | null;
          status?: PaymentStatus;
          payment_method?: PaymentMethod | null;
          paid_at?: string | null;
          receipt_number?: string | null;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          organization_id: string;
          payment_id: string;
          amount: number;
          payment_method: PaymentMethod;
          paid_at: string;
          receipt_number: string | null;
          memo: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          payment_id: string;
          amount: number;
          payment_method: PaymentMethod;
          paid_at?: string;
          receipt_number?: string | null;
          memo?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          payment_id?: string;
          amount?: number;
          payment_method?: PaymentMethod;
          paid_at?: string;
          receipt_number?: string | null;
          memo?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          organization_id: string;
          expense_date: string;
          category: string;
          amount: number;
          payment_method: PaymentMethod;
          description: string;
          recipient: string | null;
          vendor: string | null;
          memo: string | null;
          receipt_memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          expense_date: string;
          category: string;
          amount: number;
          payment_method?: PaymentMethod;
          description?: string;
          recipient?: string | null;
          vendor?: string | null;
          memo?: string | null;
          receipt_memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['core']['Tables']['expenses']['Insert']>;
        Relationships: [];
      };
      income_entries: {
        Row: {
          id: string;
          organization_id: string;
          income_date: string;
          category: string;
          amount: number;
          payment_method: PaymentMethod;
          description: string;
          payer: string | null;
          memo: string | null;
          source_type: string;
          source_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          income_date: string;
          category: string;
          amount: number;
          payment_method?: PaymentMethod;
          description?: string;
          payer?: string | null;
          memo?: string | null;
          source_type?: string;
          source_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['core']['Tables']['income_entries']['Insert']>;
        Relationships: [];
      };
      consultations: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          staff_id: string | null;
          consultation_date: string;
          type: string;
          content: string | null;
          result: string | null;
          follow_up: string | null;
          next_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          staff_id?: string | null;
          consultation_date?: string;
          type?: string;
          content?: string | null;
          result?: string | null;
          follow_up?: string | null;
          next_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          customer_id?: string;
          staff_id?: string | null;
          consultation_date?: string;
          type?: string;
          content?: string | null;
          result?: string | null;
          follow_up?: string | null;
          next_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          title: string;
          message: string;
          target_type: string | null;
          target_id: string | null;
          status: NotificationStatus;
          channel: NotificationChannel;
          scheduled_at: string | null;
          sent_at: string | null;
          metadata: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: string;
          title: string;
          message: string;
          target_type?: string | null;
          target_id?: string | null;
          status?: NotificationStatus;
          channel?: NotificationChannel;
          scheduled_at?: string | null;
          sent_at?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: string;
          title?: string;
          message?: string;
          target_type?: string | null;
          target_id?: string | null;
          status?: NotificationStatus;
          channel?: NotificationChannel;
          scheduled_at?: string | null;
          sent_at?: string | null;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: {
          p_name: string;
          p_industry_type?: string;
          p_slug?: string | null;
          p_settings?: Record<string, unknown> | null;
        };
        Returns: string;
      };
      is_org_member: {
        Args: { org_id: string };
        Returns: boolean;
      };
      get_org_role: {
        Args: { org_id: string };
        Returns: MemberRole;
      };
      is_org_admin: {
        Args: { org_id: string };
        Returns: boolean;
      };
      is_org_owner_or_admin: {
        Args: { org_id: string };
        Returns: boolean;
      };
      delete_my_account: {
        Args: Record<string, never>;
        Returns: Json;
      };
      parent_set_child_check_in_pin: {
        Args: { p_org_id: string; p_customer_id: string; p_pin: string };
        Returns: Json;
      };
      parent_clear_child_check_in_pin: {
        Args: { p_org_id: string; p_customer_id: string };
        Returns: Json;
      };
      parent_generate_child_check_in_pin: {
        Args: { p_org_id: string; p_customer_id: string };
        Returns: Json;
      };
      invite_staff_member: {
        Args: { p_org_id: string; p_staff_id: string; p_email: string };
        Returns: Json;
      };
      revoke_staff_invitation: {
        Args: { p_org_id: string; p_staff_id: string };
        Returns: undefined;
      };
      get_staff_account_statuses: {
        Args: { p_org_id: string };
        Returns: Json;
      };
      connect_parent_on_login: {
        Args: Record<string, never>;
        Returns: Json;
      };
      connect_staff_on_login: {
        Args: Record<string, never>;
        Returns: Json;
      };
      sync_auth_providers_on_login: {
        Args: Record<string, never>;
        Returns: Json;
      };
      register_auth_provider: {
        Args: {
          p_provider: string;
          p_provider_user_id: string;
          p_email?: string | null;
          p_phone?: string | null;
          p_metadata?: Json;
        };
        Returns: Json;
      };
      invite_parent_member: {
        Args: { p_org_id: string; p_parent_customer_id: string; p_email: string };
        Returns: Json;
      };
      revoke_parent_invitation: {
        Args: { p_org_id: string; p_parent_customer_id: string };
        Returns: undefined;
      };
      get_parent_account_statuses: {
        Args: { p_org_id: string };
        Returns: Json;
      };
      ensure_global_parent_profile: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_my_parent_portal_tree: {
        Args: Record<string, never>;
        Returns: Json;
      };
      create_guardian_link_token: {
        Args: {
          p_org_id: string;
          p_customer_id: string;
          p_expires_days?: number;
          p_max_uses?: number;
        };
        Returns: Json;
      };
      list_guardian_link_tokens: {
        Args: { p_org_id: string };
        Returns: Json;
      };
      revoke_guardian_link_token: {
        Args: { p_org_id: string; p_token_id: string };
        Returns: undefined;
      };
      redeem_guardian_link_token: {
        Args: { p_token: string; p_shared_fields?: Json };
        Returns: Json;
      };
      parent_register_child: {
        Args: {
          p_display_name: string;
          p_birth_date?: string | null;
          p_relationship?: string;
          p_is_primary?: boolean;
        };
        Returns: Json;
      };
      ensure_org_parent_customer: {
        Args: { p_parent_id: string; p_org_id: string };
        Returns: string;
      };
      sync_org_parent_student_bridge: {
        Args: { p_org_id: string };
        Returns: Json;
      };
      sync_guardians_for_parent_org: {
        Args: { p_parent_id: string; p_org_id: string };
        Returns: number;
      };
      sync_parent_student_links_for_parent_org: {
        Args: { p_parent_id: string; p_org_id: string };
        Returns: number;
      };
      sync_org_parent_student_links_reverse: {
        Args: { p_org_id: string };
        Returns: Json;
      };
      create_parent_invite_link_tokens: {
        Args: {
          p_org_id: string;
          p_parent_customer_id: string;
          p_expires_days?: number;
        };
        Returns: Json;
      };
      // Phase 2: Customer join & org discovery RPCs
      search_public_organizations: {
        Args: {
          p_query: string;
          p_industry_type?: string | null;
          p_limit?: number;
        };
        Returns: Array<{
          id: string;
          name: string;
          industry_type: string;
          public_code: string;
          slug: string | null;
          address: string | null;
          phone: string | null;
          is_active: boolean;
        }>;
      };
      get_public_organization_by_code: {
        Args: {
          p_code: string;
        };
        Returns: Array<{
          id: string;
          name: string;
          industry_type: string;
          public_code: string;
          slug: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          description: string | null;
          business_hours: string | null;
          is_active: boolean;
        }>;
      };
      submit_customer_join_request: {
        Args: {
          p_org_id: string;
          p_applicant_name: string;
          p_applicant_phone?: string | null;
          p_applicant_email?: string | null;
          p_request_type?: string;
          p_message?: string | null;
          p_customer_metadata?: Json;
        };
        Returns: string;
      };
      approve_customer_join_request: {
        Args: {
          p_request_id: string;
          p_role?: string;
        };
        Returns: Json;
      };
      reject_customer_join_request: {
        Args: {
          p_request_id: string;
          p_reject_reason?: string | null;
        };
        Returns: boolean;
      };
      submit_public_consultation: {
        Args: {
          p_org_id: string;
          p_contact_name: string;
          p_contact_phone: string;
          p_message: string;
          p_preferred_time?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      member_role: MemberRole;
      schedule_status: ScheduleStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      notification_status: NotificationStatus;
      notification_channel: NotificationChannel;
    };
    CompositeTypes: Record<string, never>;
  };
  piano: {
    Tables: {
      customers: {
        Row: {
          customer_id: string;
          organization_id: string;
          student_number: string;
          gender: string;
          birth_date: string | null;
          school: string | null;
          grade: string | null;
          level: string;
          tuition_fee: number;
          payment_day: number;
          teacher_id: string | null;
          join_date: string | null;
          leave_date: string | null;
          special_notes: string | null;
          avatar_color: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          customer_id: string;
          organization_id: string;
          student_number?: string;
          gender?: string;
          birth_date?: string | null;
          school?: string | null;
          grade?: string | null;
          level?: string;
          tuition_fee?: number;
          payment_day?: number;
          teacher_id?: string | null;
          join_date?: string | null;
          leave_date?: string | null;
          special_notes?: string | null;
          avatar_color?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['customers']['Insert']>;
        Relationships: [];
      };
      class_members: {
        Row: {
          organization_id: string;
          service_id: string;
          customer_id: string;
          created_at: string;
        };
        Insert: {
          organization_id: string;
          service_id: string;
          customer_id: string;
          created_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['class_members']['Insert']>;
        Relationships: [];
      };
      attendance: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          service_id: string | null;
          attendance_date: string;
          status: PianoAttendanceStatus;
          absent_reason: string | null;
          make_up_required: boolean;
          make_up_date: string | null;
          memo: string | null;
          created_by: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          service_id?: string | null;
          attendance_date: string;
          status?: PianoAttendanceStatus;
          absent_reason?: string | null;
          make_up_required?: boolean;
          make_up_date?: string | null;
          memo?: string | null;
          created_by?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['attendance']['Insert']>;
        Relationships: [];
      };
      lesson_records: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          staff_id: string | null;
          service_id: string | null;
          lesson_date: string;
          song_title: string;
          progress: string | null;
          lesson_content: string | null;
          strengths: string | null;
          weaknesses: string | null;
          homework: string | null;
          next_plan: string | null;
          teacher_notes: string | null;
          memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          staff_id?: string | null;
          service_id?: string | null;
          lesson_date: string;
          song_title?: string;
          progress?: string | null;
          lesson_content?: string | null;
          strengths?: string | null;
          weaknesses?: string | null;
          homework?: string | null;
          next_plan?: string | null;
          teacher_notes?: string | null;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['lesson_records']['Insert']>;
        Relationships: [];
      };
      practice_records: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          practice_date: string;
          minutes: number;
          song_title: string;
          textbook: string | null;
          page: string | null;
          homework: string | null;
          teacher_evaluation: string | null;
          difficulty_part: string | null;
          next_assignment: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          practice_date: string;
          minutes?: number;
          song_title?: string;
          textbook?: string | null;
          page?: string | null;
          homework?: string | null;
          teacher_evaluation?: string | null;
          difficulty_part?: string | null;
          next_assignment?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['practice_records']['Insert']>;
        Relationships: [];
      };
      textbooks: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          publisher: string;
          author: string | null;
          isbn: string | null;
          level: string;
          sale_price: number;
          cost_price: number;
          stock: number;
          min_stock: number;
          is_for_sale: boolean;
          memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          publisher?: string;
          author?: string | null;
          isbn?: string | null;
          level?: string;
          sale_price?: number;
          cost_price?: number;
          stock?: number;
          min_stock?: number;
          is_for_sale?: boolean;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['textbooks']['Insert']>;
        Relationships: [];
      };
      textbook_sales: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          textbook_id: string;
          sale_date: string;
          quantity: number;
          unit_price: number;
          discount: number;
          total_amount: number;
          paid_amount: number;
          status: PianoTextbookPaymentStatus;
          payment_method: PaymentMethod | null;
          memo: string | null;
          staff_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          textbook_id: string;
          sale_date?: string;
          quantity?: number;
          unit_price?: number;
          discount?: number;
          total_amount?: number;
          paid_amount?: number;
          status?: PianoTextbookPaymentStatus;
          payment_method?: PaymentMethod | null;
          memo?: string | null;
          staff_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['textbook_sales']['Insert']>;
        Relationships: [];
      };
      textbook_payments: {
        Row: {
          id: string;
          organization_id: string;
          textbook_sale_id: string;
          payment_date: string;
          amount: number;
          payment_method: PaymentMethod;
          memo: string | null;
          receipt_number: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          textbook_sale_id: string;
          payment_date?: string;
          amount: number;
          payment_method?: PaymentMethod;
          memo?: string | null;
          receipt_number?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['textbook_payments']['Insert']>;
        Relationships: [];
      };
      textbook_inventory_transactions: {
        Row: {
          id: string;
          organization_id: string;
          textbook_id: string;
          transaction_type: PianoInventoryTransactionType;
          quantity: number;
          previous_stock: number;
          current_stock: number;
          reference_id: string | null;
          transaction_date: string;
          memo: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          textbook_id: string;
          transaction_type: PianoInventoryTransactionType;
          quantity: number;
          previous_stock?: number;
          current_stock?: number;
          reference_id?: string | null;
          transaction_date?: string;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['textbook_inventory_transactions']['Insert']>;
        Relationships: [];
      };
      songs: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          composer: string;
          difficulty: string;
          genre: string;
          related_textbook: string | null;
          memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          composer?: string;
          difficulty?: string;
          genre?: string;
          related_textbook?: string | null;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['songs']['Insert']>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          organization_id: string;
          expense_date: string;
          category: string;
          amount: number;
          payment_method: PaymentMethod;
          description: string;
          recipient: string | null;
          vendor: string | null;
          memo: string | null;
          receipt_memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          expense_date: string;
          category: string;
          amount: number;
          payment_method?: PaymentMethod;
          description?: string;
          recipient?: string | null;
          vendor?: string | null;
          memo?: string | null;
          receipt_memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['expenses']['Insert']>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          start_date: string;
          end_date: string | null;
          event_type: string;
          description: string | null;
          color: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          start_date: string;
          end_date?: string | null;
          event_type?: string;
          description?: string | null;
          color?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['events']['Insert']>;
        Relationships: [];
      };
      performance_videos: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          title: string;
          youtube_url: string;
          recorded_date: string | null;
          event_type: string;
          song_title: string | null;
          memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          title: string;
          youtube_url: string;
          recorded_date?: string | null;
          event_type?: string;
          song_title?: string | null;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['performance_videos']['Insert']>;
        Relationships: [];
      };
      curriculum_levels: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          sort_order: number;
          description: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          sort_order?: number;
          description?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['curriculum_levels']['Insert']>;
        Relationships: [];
      };
      curriculum_items: {
        Row: {
          id: string;
          organization_id: string;
          level_id: string;
          song_id: string | null;
          title: string;
          sort_order: number;
          required: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          level_id: string;
          song_id?: string | null;
          title: string;
          sort_order?: number;
          required?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['curriculum_items']['Insert']>;
        Relationships: [];
      };
      student_curriculum_progress: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          curriculum_item_id: string;
          status: CurriculumProgressStatus;
          completed_at: string | null;
          notes: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          curriculum_item_id: string;
          status?: CurriculumProgressStatus;
          completed_at?: string | null;
          notes?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['student_curriculum_progress']['Insert']>;
        Relationships: [];
      };
      weekly_assignments: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          staff_id: string | null;
          week_start: string;
          title: string | null;
          status: AssignmentStatus;
          teacher_notes: string | null;
          parent_notes: string | null;
          due_date: string | null;
          published_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          staff_id?: string | null;
          week_start: string;
          title?: string | null;
          status?: AssignmentStatus;
          teacher_notes?: string | null;
          parent_notes?: string | null;
          due_date?: string | null;
          published_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['weekly_assignments']['Insert']>;
        Relationships: [];
      };
      assignment_items: {
        Row: {
          id: string;
          assignment_id: string;
          organization_id: string;
          song_title: string;
          target_minutes: number | null;
          instructions: string;
          sort_order: number;
          parent_confirmed: boolean;
          parent_confirmed_at: string | null;
          completed: boolean;
          completed_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          organization_id: string;
          song_title: string;
          target_minutes?: number | null;
          instructions?: string;
          sort_order?: number;
          parent_confirmed?: boolean;
          parent_confirmed_at?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['assignment_items']['Insert']>;
        Relationships: [];
      };
      achievements: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          type: AchievementType;
          title: string;
          event_date: string | null;
          result: string | null;
          level_label: string | null;
          song_title: string | null;
          certificate_url: string | null;
          staff_id: string | null;
          memo: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          type: AchievementType;
          title: string;
          event_date?: string | null;
          result?: string | null;
          level_label?: string | null;
          song_title?: string | null;
          certificate_url?: string | null;
          staff_id?: string | null;
          memo?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['achievements']['Insert']>;
        Relationships: [];
      };
      learning_reports: {
        Row: {
          id: string;
          organization_id: string;
          customer_id: string;
          staff_id: string | null;
          year_month: string;
          status: LearningReportStatus;
          summary: string | null;
          strengths: string | null;
          improvements: string | null;
          goals_next_month: string | null;
          attendance_rate: number | null;
          practice_minutes: number | null;
          lessons_count: number | null;
          songs_completed: number | null;
          published_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          customer_id: string;
          staff_id?: string | null;
          year_month: string;
          status?: LearningReportStatus;
          summary?: string | null;
          strengths?: string | null;
          improvements?: string | null;
          goals_next_month?: string | null;
          attendance_rate?: number | null;
          practice_minutes?: number | null;
          lessons_count?: number | null;
          songs_completed?: number | null;
          published_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['piano']['Tables']['learning_reports']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      attendance_status: PianoAttendanceStatus;
      inventory_transaction_type: PianoInventoryTransactionType;
      textbook_payment_status: PianoTextbookPaymentStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type PianoAttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave' | 'make_up';
export type PianoInventoryTransactionType = 'inbound' | 'sale' | 'return' | 'adjust';
export type PianoTextbookPaymentStatus = 'unpaid' | 'partial' | 'paid';

/** Core 테이블 Row 타입 헬퍼 */
export type CoreTables<T extends keyof Database['core']['Tables']> =
  Database['core']['Tables'][T]['Row'];

export type Organization = CoreTables<'organizations'>;
export type Profile = CoreTables<'profiles'>;
export type OrganizationMember = CoreTables<'organization_members'>;
export type Customer = CoreTables<'customers'>;
export type CustomerContact = CoreTables<'customer_contacts'>;
export type Staff = CoreTables<'staff'>;
export type Service = CoreTables<'services'>;
export type Schedule = CoreTables<'schedules'>;
export type Payment = CoreTables<'payments'>;
export type PaymentTransaction = CoreTables<'payment_transactions'>;
export type Consultation = CoreTables<'consultations'>;
export type Notification = CoreTables<'notifications'>;
