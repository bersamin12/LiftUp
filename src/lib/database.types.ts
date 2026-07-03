/**
 * Supabase database type stubs.
 *
 * IMPORTANT: Replace this file with the auto-generated types from Supabase CLI:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
 *
 * These stubs are sufficient for development before Supabase is connected.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      blocks: {
        Row: {
          block_id: string;
          block_number: string;
          street_name: string;
          town: string;
          grc: string;
          postal_code: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['blocks']['Row'], 'block_id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['blocks']['Insert']>;
      };
      residents: {
        Row: {
          id: string;
          display_name: string;
          phone: string;
          block_id: string | null;
          unit_ref: string | null;
          caregiver_id: string | null;
          is_caregiver: boolean;
          invite_code: string | null;
          total_points: number;
          badge_level: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['residents']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['residents']['Insert']>;
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          uen: string;
          contact_person: string | null;
          contact_role: string | null;
          logo_url: string | null;
          verification_status: 'pending' | 'verified' | 'rejected';
          admin_approved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };
      org_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: 'coordinator' | 'collector' | 'admin';
        };
        Insert: Omit<Database['public']['Tables']['org_members']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['org_members']['Insert']>;
      };
      campaigns: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          starts_at: string;
          ends_at: string;
          accepted_categories: string[];
          area_mode: 'single_block' | 'multi_block' | 'whole_area';
          area_reference: string | null;
          area_blocks: string[] | null;
          status: 'draft' | 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
      collection_runs: {
        Row: {
          id: string;
          campaign_id: string;
          run_date: string;
          time_window_start: string;
          time_window_end: string;
          area_blocks: string[];
          route_plan: Json | null;
          pickup_slots: Json | null;
          status: 'scheduled' | 'ready' | 'active' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['collection_runs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['collection_runs']['Insert']>;
      };
      pledges: {
        Row: {
          id: string;
          resident_id: string;
          collection_run_id: string;
          photo_url: string | null;
          voice_note_url: string | null;
          voice_transcript: string | null;
          ai_suggested_category: string | null;
          ai_suggested_condition: string | null;
          ai_suggested_size: string | null;
          confirmed_category: string | null;
          confirmed_condition: string | null;
          size_bucket: string | null;
          needs_two_crew: boolean;
          pickup_slot_label: string | null;
          status: 'pending' | 'confirmed' | 'declined' | 'postponed';
          decline_reason: string | null;
          postponed_to_run_id: string | null;
          points_awarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['pledges']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['pledges']['Insert']>;
      };
      donation_interests: {
        Row: {
          id: string;
          resident_id: string;
          block_id: string;
          category: string | null;
          note: string | null;
          status: 'open' | 'matched' | 'withdrawn';
          matched_run_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['donation_interests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['donation_interests']['Insert']>;
      };
      badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon_key: string | null;
          accent_color: string | null;
          criteria_type: string;
          criteria_value: Json | null;
          points_value: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['badges']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['badges']['Insert']>;
      };
      badge_unlocks: {
        Row: {
          id: string;
          resident_id: string;
          badge_id: string;
          unlocked_at: string;
          shown: boolean;
        };
        Insert: Omit<Database['public']['Tables']['badge_unlocks']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['badge_unlocks']['Insert']>;
      };
      referrals: {
        Row: {
          id: string;
          inviter_id: string;
          invitee_id: string;
          vested: boolean;
          vested_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['referrals']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['referrals']['Insert']>;
      };
    };
    Views: {
      leaderboard_by_floor: {
        Row: {
          block_number: string;
          street_name: string;
          town: string;
          floor_number: number;
          confirmed_pledges: number;
        };
      };
    };
    Functions: {
      resolve_campaign_blocks: {
        Args: { p_campaign_id: string };
        Returns: string[];
      };
    };
    Enums: Record<string, never>;
  };
}
