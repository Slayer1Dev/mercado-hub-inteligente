export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      integration_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: number
          integration_type: string
          message: string
          status: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: number
          integration_type: string
          message: string
          status: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: number
          integration_type?: string
          message?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mercado_livre_questions: {
        Row: {
          created_at: string
          final_response: string | null
          ia_response: string | null
          id: number
          item_id: string
          question_date: string | null
          question_id: string
          question_text: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          final_response?: string | null
          ia_response?: string | null
          id?: number
          item_id: string
          question_date?: string | null
          question_id: string
          question_text: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          final_response?: string | null
          ia_response?: string | null
          id?: number
          item_id?: string
          question_date?: string | null
          question_id?: string
          question_text?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_online: boolean | null
          last_login: string | null
          name: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_online?: boolean | null
          last_login?: string | null
          name?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_online?: boolean | null
          last_login?: string | null
          name?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          created_at: string
          credentials: Json | null
          id: string
          integration_type: string
          is_connected: boolean | null
          last_sync: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credentials?: Json | null
          id?: string
          integration_type: string
          is_connected?: boolean | null
          last_sync?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credentials?: Json | null
          id?: string
          integration_type?: string
          is_connected?: boolean | null
          last_sync?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_status: Database["public"]["Enums"]["plan_status"]
          plan_type: Database["public"]["Enums"]["plan_type"]
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_status?: Database["public"]["Enums"]["plan_status"]
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_status?: Database["public"]["Enums"]["plan_status"]
          plan_type?: Database["public"]["Enums"]["plan_type"]
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      update_user_online_status: {
        Args: { is_online: boolean }
        Returns: undefined
      }
    }
    Enums: {
      plan_status: "active" | "expired" | "cancelled" | "pending"
      plan_type: "trial" | "monthly" | "quarterly" | "annual" | "lifetime"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      plan_status: ["active", "expired", "cancelled", "pending"],
      plan_type: ["trial", "monthly", "quarterly", "annual", "lifetime"],
      user_role: ["admin", "user"],
    },
  },
} as const
