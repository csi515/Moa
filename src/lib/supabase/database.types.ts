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

export type MemberRole = 'owner' | 'admin' | 'manager' | 'staff';
export type ScheduleStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'online' | 'other';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';
export type NotificationChannel = 'app' | 'email' | 'sms' | 'kakao';

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
}

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
