export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          budget_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          field_changed: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          budget_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          budget_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          field_changed?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_general_expenses: {
        Row: {
          allocation: string
          budget_id: string
          created_at: string
          id: string
          name: string
          quantity: number
          sort_order: number
          updated_at: string
          value_clp: number
        }
        Insert: {
          allocation?: string
          budget_id: string
          created_at?: string
          id?: string
          name: string
          quantity?: number
          sort_order?: number
          updated_at?: string
          value_clp: number
        }
        Update: {
          allocation?: string
          budget_id?: string
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          sort_order?: number
          updated_at?: string
          value_clp?: number
        }
        Relationships: [
          {
            foreignKeyName: "budget_general_expenses_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_lines: {
        Row: {
          created_at: string
          custom_description: string
          hh_value_clp: number
          id: string
          item_id: string | null
          line_margin: number | null
          material_value_clp: number
          partition_id: string
          quantity: number
          sort_order: number
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          custom_description: string
          hh_value_clp: number
          id?: string
          item_id?: string | null
          line_margin?: number | null
          material_value_clp: number
          partition_id: string
          quantity: number
          sort_order?: number
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          custom_description?: string
          hh_value_clp?: number
          id?: string
          item_id?: string | null
          line_margin?: number | null
          material_value_clp?: number
          partition_id?: string
          quantity?: number
          sort_order?: number
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_lines_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_partition_id_fkey"
            columns: ["partition_id"]
            isOneToOne: false
            referencedRelation: "budget_partitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_lines_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_partitions: {
        Row: {
          budget_id: string
          created_at: string
          id: string
          is_awarded: boolean
          name: string
          number: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          budget_id: string
          created_at?: string
          id?: string
          is_awarded?: boolean
          name: string
          number: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          budget_id?: string
          created_at?: string
          id?: string
          is_awarded?: boolean
          name?: string
          number?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_partitions_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          client_id: string | null
          code: string
          considerations: string | null
          created_at: string
          created_by: string | null
          global_margin: number
          id: string
          parent_budget_id: string | null
          project_location: string | null
          project_name: string | null
          proposal_duration: string | null
          revision: number
          sent_at: string | null
          status: string
          uf_value_at_creation: number
          uf_value_at_send: number | null
          total_uf_final: number | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          code: string
          considerations?: string | null
          created_at?: string
          created_by?: string | null
          global_margin?: number
          id?: string
          parent_budget_id?: string | null
          project_location?: string | null
          project_name?: string | null
          proposal_duration?: string | null
          revision?: number
          sent_at?: string | null
          status?: string
          uf_value_at_creation: number
          uf_value_at_send?: number | null
          total_uf_final?: number | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          code?: string
          considerations?: string | null
          created_at?: string
          created_by?: string | null
          global_margin?: number
          id?: string
          parent_budget_id?: string | null
          project_location?: string | null
          project_name?: string | null
          proposal_duration?: string | null
          revision?: number
          sent_at?: string | null
          status?: string
          uf_value_at_creation?: number
          uf_value_at_send?: number | null
          total_uf_final?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budgets_parent_budget_id_fkey"
            columns: ["parent_budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          city: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      general_expenses_catalog: {
        Row: {
          created_at: string
          default_value_clp: number
          id: string
          is_active: boolean
          name: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_value_clp: number
          id?: string
          is_active?: boolean
          name: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_value_clp?: number
          id?: string
          is_active?: boolean
          name?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          code: string
          company_id: string
          created_at: string
          default_margin: number
          description: string
          hh_value_clp: number
          id: string
          is_active: boolean
          last_reviewed_at: string
          material_value_clp: number
          partition_type: string
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string
          default_margin?: number
          description: string
          hh_value_clp: number
          id?: string
          is_active?: boolean
          last_reviewed_at?: string
          material_value_clp: number
          partition_type: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string
          default_margin?: number
          description?: string
          hh_value_clp?: number
          id?: string
          is_active?: boolean
          last_reviewed_at?: string
          material_value_clp?: number
          partition_type?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      uf_cache: {
        Row: {
          date: string
          fetched_at: string
          id: string
          source: string
          value: number
        }
        Insert: {
          date: string
          fetched_at?: string
          id?: string
          source?: string
          value: number
        }
        Update: {
          date?: string
          fetched_at?: string
          id?: string
          source?: string
          value?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

