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
