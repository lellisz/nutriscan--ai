// ============================================================
// PRAXIS Nutrition — Supabase Database Types
//
// Inferred from supabase/migrations/001..010 (canonical schema).
// Tables 006-010 are pre-typed to match the schemas Agent 1
// is creating (achievements, quests, partner_invites,
// recipes, wearable_metrics etc.).
//
// IMPORTANT: profiles uses `user_id` as canonical PK
// (see migration 006_unify_profiles_pk.sql).
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Domain enums ────────────────────────────────────────────
export type Goal = 'lose_weight' | 'gain_muscle' | 'maintain' | 'health';
export type DailyContext = 'normal' | 'stress' | 'travel' | 'celebrate' | 'hard' | 'restricao' | 'academia';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type FastingProtocol = '12:12' | '16:8' | '18:6' | '24h';
export type CoachRole = 'user' | 'assistant';
export type ConsentType =
  | 'health_data_processing'
  | 'ai_coach_processing'
  | 'partner_score_sharing'
  | 'wearable_integration'
  | 'marketing_communications'
  | 'analytics_anonymous';

// ============================================================
// Database
// ============================================================
export interface Database {
  public: {
    Tables: {
      // ── profiles (001/002 + 005 + 006) ────────────────────
      profiles: {
        Row: {
          user_id: string;
          name: string | null;
          email: string | null;
          age: number | null;
          height_cm: number | null;
          weight_kg: number | null;
          target_weight_kg: number | null;
          goal: Goal | null;
          activity_level: number | null;
          gender: 'M' | 'F' | null;
          calories_target: number | null;
          protein_target: number | null;
          hydration_target: number | null;
          compassion_mode: boolean | null;
          quiet_intelligence: boolean | null;
          adaptive_goals: boolean | null;
          nutrition_memory: boolean | null;
          privacy_version: string | null;
          breakfast_reminder_hour: number | null;
          lunch_reminder_hour: number | null;
          dinner_reminder_hour: number | null;
          hydration_reminder_interval_min: number | null;
          reminder_lunch_hour: number | null;
          reminder_dinner_hour: number | null;
          reminders_enabled: boolean | null;
          full_name: string | null;
          height: number | null;
          weight: number | null;
          avatar_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          name?: string | null;
          email?: string | null;
          age?: number | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          target_weight_kg?: number | null;
          goal?: Goal | null;
          activity_level?: number | null;
          gender?: 'M' | 'F' | null;
          calories_target?: number | null;
          protein_target?: number | null;
          hydration_target?: number | null;
          compassion_mode?: boolean | null;
          quiet_intelligence?: boolean | null;
          adaptive_goals?: boolean | null;
          nutrition_memory?: boolean | null;
          privacy_version?: string | null;
          breakfast_reminder_hour?: number | null;
          lunch_reminder_hour?: number | null;
          dinner_reminder_hour?: number | null;
          hydration_reminder_interval_min?: number | null;
          reminder_lunch_hour?: number | null;
          reminder_dinner_hour?: number | null;
          reminders_enabled?: boolean | null;
          full_name?: string | null;
          height?: number | null;
          weight?: number | null;
          avatar_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };

      // ── daily_logs ────────────────────────────────────────
      daily_logs: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          context: DailyContext | null;
          score: number | null;
          calories_consumed: number | null;
          protein_consumed: number | null;
          carbs_consumed: number | null;
          fat_consumed: number | null;
          hydration_ml: number | null;
          sleep_hours: number | null;
          sleep_quality: number | null;
          mood: number | null;
          energy_level: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          context?: DailyContext | null;
          score?: number | null;
          calories_consumed?: number | null;
          protein_consumed?: number | null;
          carbs_consumed?: number | null;
          fat_consumed?: number | null;
          hydration_ml?: number | null;
          sleep_hours?: number | null;
          sleep_quality?: number | null;
          mood?: number | null;
          energy_level?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['daily_logs']['Insert']>;
        Relationships: [];
      };

      // ── meals ─────────────────────────────────────────────
      meals: {
        Row: {
          id: string;
          user_id: string;
          date: string | null;
          meal_type: MealType | null;
          name: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          fiber: number | null;
          logged_at: string | null;
          created_at: string | null;
          source: string | null;
          confidence: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date?: string | null;
          meal_type?: MealType | null;
          name: string;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          fiber?: number | null;
          logged_at?: string | null;
          created_at?: string | null;
          source?: string | null;
          confidence?: string | null;
          image_url?: string | null;
        };
        Update: Partial<Database['public']['Tables']['meals']['Insert']>;
        Relationships: [];
      };

      // ── frequent_meals ────────────────────────────────────
      frequent_meals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          count: number;
          last_used: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          count?: number;
          last_used?: string | null;
        };
        Update: Partial<Database['public']['Tables']['frequent_meals']['Insert']>;
        Relationships: [];
      };

      // ── fasting_sessions ──────────────────────────────────
      fasting_sessions: {
        Row: {
          id: string;
          user_id: string;
          protocol: FastingProtocol;
          started_at: string;
          ended_at: string | null;
          completed: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          protocol: FastingProtocol;
          started_at: string;
          ended_at?: string | null;
          completed?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['fasting_sessions']['Insert']>;
        Relationships: [];
      };

      // ── partners ──────────────────────────────────────────
      partners: {
        Row: {
          id: string;
          user_id: string;
          partner_id: string;
          status: 'pending' | 'active';
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          partner_id: string;
          status: 'pending' | 'active';
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['partners']['Insert']>;
        Relationships: [];
      };

      // ── coach_messages (substitui chat_messages) ──────────
      coach_messages: {
        Row: {
          id: string;
          user_id: string;
          role: CoachRole;
          content: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: CoachRole;
          content: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['coach_messages']['Insert']>;
        Relationships: [];
      };

      // ── behavior_patterns ─────────────────────────────────
      behavior_patterns: {
        Row: {
          id: string;
          user_id: string;
          pattern_kind: string;
          pattern_data: Json | null;
          pattern_key: string | null;
          value: Json | null;
          updated_at: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          pattern_kind: string;
          pattern_data?: Json | null;
          pattern_key?: string | null;
          value?: Json | null;
          updated_at?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['behavior_patterns']['Insert']>;
        Relationships: [];
      };

      // ── consents ──────────────────────────────────────────
      consents: {
        Row: {
          id: string;
          user_id: string;
          kind: ConsentType | null;
          consent_type: ConsentType;
          granted: boolean;
          granted_at: string | null;
          revoked_at: string | null;
          consent_version: string;
          app_version: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind?: ConsentType | null;
          consent_type: ConsentType;
          granted: boolean;
          granted_at?: string | null;
          revoked_at?: string | null;
          consent_version?: string;
          app_version?: string | null;
        };
        Update: Partial<Database['public']['Tables']['consents']['Insert']>;
        Relationships: [];
      };

      // ── weight_logs ───────────────────────────────────────
      weight_logs: {
        Row: {
          id: string;
          user_id: string;
          weight_kg: number;
          body_fat_pct: number | null;
          note: string | null;
          logged_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          weight_kg: number;
          body_fat_pct?: number | null;
          note?: string | null;
          logged_at?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['weight_logs']['Insert']>;
        Relationships: [];
      };

      // ── food_logs ─────────────────────────────────────────
      // Histórico cru de scans / registros manuais (legacy + scans não confirmados).
      food_logs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          food_name: string | null;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          logged_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          food_name?: string | null;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          logged_at?: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['food_logs']['Insert']>;
        Relationships: [];
      };

      // ── security_log ──────────────────────────────────────
      security_log: {
        Row: {
          id: number;
          user_id: string | null;
          action: string | null;
          event: string | null;
          ip_address: string | null;
          ip_hash: string | null;
          user_agent: string | null;
          details: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          action?: string | null;
          event?: string | null;
          ip_address?: string | null;
          ip_hash?: string | null;
          user_agent?: string | null;
          details?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['security_log']['Insert']>;
        Relationships: [];
      };

      // ── deletion_audit_log ────────────────────────────────
      deletion_audit_log: {
        Row: {
          id: number;
          user_id: string | null;
          user_id_hash: string | null;
          deleted_at: string;
          reason: string | null;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          user_id_hash?: string | null;
          deleted_at?: string;
          reason?: string | null;
        };
        Update: Partial<Database['public']['Tables']['deletion_audit_log']['Insert']>;
        Relationships: [];
      };

      // ── meal_photos (007) ─────────────────────────────────
      meal_photos: {
        Row: {
          id: string;
          user_id: string;
          meal_id: string | null;
          storage_path: string;
          analysis_json: Json | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_id?: string | null;
          storage_path: string;
          analysis_json?: Json | null;
          confidence?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['meal_photos']['Insert']>;
        Relationships: [];
      };

      // ── daily_insights (007) ──────────────────────────────
      daily_insights: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          kind: 'nutrition' | 'sleep' | 'activity' | 'glucose' | 'behavior';
          title: string;
          body: string | null;
          priority: number | null;
          dismissed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          kind: 'nutrition' | 'sleep' | 'activity' | 'glucose' | 'behavior';
          title: string;
          body?: string | null;
          priority?: number | null;
          dismissed?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['daily_insights']['Insert']>;
        Relationships: [];
      };

      // ── glucose_predictions (007) ─────────────────────────
      glucose_predictions: {
        Row: {
          id: string;
          user_id: string;
          meal_id: string | null;
          predicted_at: string;
          peak_mmol: number | null;
          area_under_curve: number | null;
          recommendation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          meal_id?: string | null;
          predicted_at: string;
          peak_mmol?: number | null;
          area_under_curve?: number | null;
          recommendation?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['glucose_predictions']['Insert']>;
        Relationships: [];
      };

      // ── achievements (008 — gamification) ─────────────────
      achievements: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string | null;
          icon: string | null;
          tier: number | null;
          xp_reward: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          tier?: number | null;
          xp_reward?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>;
        Relationships: [];
      };

      // ── user_achievements (008) ───────────────────────────
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          progress: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          progress?: number | null;
        };
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
        Relationships: [];
      };

      // ── quests (008) ──────────────────────────────────────
      quests: {
        Row: {
          id: string;
          code: string;
          title: string;
          description: string | null;
          target_value: number | null;
          xp_reward: number | null;
          duration_days: number | null;
          active: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          title: string;
          description?: string | null;
          target_value?: number | null;
          xp_reward?: number | null;
          duration_days?: number | null;
          active?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['quests']['Insert']>;
        Relationships: [];
      };

      // ── user_quests (008) ─────────────────────────────────
      user_quests: {
        Row: {
          id: string;
          user_id: string;
          quest_id: string;
          progress: number;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          quest_id: string;
          progress?: number;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['user_quests']['Insert']>;
        Relationships: [];
      };

      // ── streak_state (008) ────────────────────────────────
      streak_state: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_logged_date: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_logged_date?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['streak_state']['Insert']>;
        Relationships: [];
      };

      // ── partner_invites (009) ─────────────────────────────
      partner_invites: {
        Row: {
          id: string;
          inviter_id: string;
          invitee_email: string | null;
          invitee_id: string | null;
          token: string;
          status: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          invitee_email?: string | null;
          invitee_id?: string | null;
          token: string;
          status?: 'pending' | 'accepted' | 'declined' | 'expired';
          created_at?: string;
          expires_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['partner_invites']['Insert']>;
        Relationships: [];
      };

      // ── recipes (009) ─────────────────────────────────────
      recipes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          ingredients: Json | null;
          instructions: string | null;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
          servings: number | null;
          public: boolean;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          ingredients?: Json | null;
          instructions?: string | null;
          calories?: number | null;
          protein?: number | null;
          carbs?: number | null;
          fat?: number | null;
          servings?: number | null;
          public?: boolean;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['recipes']['Insert']>;
        Relationships: [];
      };

      // ── recipe_shares (009) ───────────────────────────────
      recipe_shares: {
        Row: {
          id: string;
          recipe_id: string;
          shared_by: string;
          shared_with: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          shared_by: string;
          shared_with: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['recipe_shares']['Insert']>;
        Relationships: [];
      };

      // ── cohort_buckets (009) ──────────────────────────────
      cohort_buckets: {
        Row: {
          id: string;
          name: string;
          criteria: Json | null;
          user_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          criteria?: Json | null;
          user_count?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['cohort_buckets']['Insert']>;
        Relationships: [];
      };

      // ── wearable_metrics (010) ────────────────────────────
      wearable_metrics: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          metric: string;
          value: number;
          unit: string | null;
          recorded_at: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          metric: string;
          value: number;
          unit?: string | null;
          recorded_at: string;
          created_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['wearable_metrics']['Insert']>;
        Relationships: [];
      };

      // ── sync_log (010) ────────────────────────────────────
      sync_log: {
        Row: {
          id: string;
          user_id: string;
          source: string;
          synced_at: string;
          status: 'success' | 'error' | 'partial';
          records_count: number | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: string;
          synced_at?: string;
          status: 'success' | 'error' | 'partial';
          records_count?: number | null;
          error_message?: string | null;
        };
        Update: Partial<Database['public']['Tables']['sync_log']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

// ── Helpers ────────────────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
