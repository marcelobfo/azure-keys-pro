export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          page_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      analytics_summary: {
        Row: {
          chat_messages: number | null
          created_at: string
          data: Json | null
          date: string
          favorites_added: number | null
          id: string
          leads_generated: number | null
          page_views: number | null
          property_views: number | null
          unique_visitors: number | null
          updated_at: string
          visits_scheduled: number | null
        }
        Insert: {
          chat_messages?: number | null
          created_at?: string
          data?: Json | null
          date?: string
          favorites_added?: number | null
          id?: string
          leads_generated?: number | null
          page_views?: number | null
          property_views?: number | null
          unique_visitors?: number | null
          updated_at?: string
          visits_scheduled?: number | null
        }
        Update: {
          chat_messages?: number | null
          created_at?: string
          data?: Json | null
          date?: string
          favorites_added?: number | null
          id?: string
          leads_generated?: number | null
          page_views?: number | null
          property_views?: number | null
          unique_visitors?: number | null
          updated_at?: string
          visits_scheduled?: number | null
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          active: boolean | null
          created_at: string | null
          expires_at: string | null
          id: string
          last_used_at: string | null
          permissions: Json | null
          token_hash: string
          token_name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          permissions?: Json | null
          token_hash: string
          token_name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          last_used_at?: string | null
          permissions?: Json | null
          token_hash?: string
          token_name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_configurations: {
        Row: {
          active: boolean | null
          ai_chat_enabled: boolean | null
          api_key_encrypted: string | null
          api_provider: string
          company: string
          created_at: string | null
          custom_responses: Json | null
          id: string
          system_instruction: string | null
          updated_at: string | null
          welcome_message: string | null
          whatsapp_enabled: boolean | null
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          ai_chat_enabled?: boolean | null
          api_key_encrypted?: string | null
          api_provider?: string
          company: string
          created_at?: string | null
          custom_responses?: Json | null
          id?: string
          system_instruction?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          ai_chat_enabled?: boolean | null
          api_key_encrypted?: string | null
          api_provider?: string
          company?: string
          created_at?: string | null
          custom_responses?: Json | null
          id?: string
          system_instruction?: string | null
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          property_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          property_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          notification_preferences: Json | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          social_links: Json | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          notification_preferences?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          notification_preferences?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          social_links?: Json | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          broker_creci: string | null
          broker_name: string | null
          built_area: number | null
          city: string
          condo_fee: number | null
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
          infra: Json | null
          iptu_fee: number | null
          is_beachfront: boolean | null
          is_development: boolean | null
          is_featured: boolean | null
          is_near_beach: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          negotiation_notes: string | null
          price: number
          property_code: string | null
          property_type: string
          purpose: string | null
          reference_point: string | null
          rental_price: number | null
          slug: string | null
          state: string | null
          status: string | null
          suites: number | null
          tags: string[] | null
          title: string
          total_area: number | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
          view_count: number | null
          virtual_tour_url: string | null
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_creci?: string | null
          broker_name?: string | null
          built_area?: number | null
          city: string
          condo_fee?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          infra?: Json | null
          iptu_fee?: number | null
          is_beachfront?: boolean | null
          is_development?: boolean | null
          is_featured?: boolean | null
          is_near_beach?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          negotiation_notes?: string | null
          price: number
          property_code?: string | null
          property_type: string
          purpose?: string | null
          reference_point?: string | null
          rental_price?: number | null
          slug?: string | null
          state?: string | null
          status?: string | null
          suites?: number | null
          tags?: string[] | null
          title: string
          total_area?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          view_count?: number | null
          virtual_tour_url?: string | null
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          broker_creci?: string | null
          broker_name?: string | null
          built_area?: number | null
          city?: string
          condo_fee?: number | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          infra?: Json | null
          iptu_fee?: number | null
          is_beachfront?: boolean | null
          is_development?: boolean | null
          is_featured?: boolean | null
          is_near_beach?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          negotiation_notes?: string | null
          price?: number
          property_code?: string | null
          property_type?: string
          purpose?: string | null
          reference_point?: string | null
          rental_price?: number | null
          slug?: string | null
          state?: string | null
          status?: string | null
          suites?: number | null
          tags?: string[] | null
          title?: string
          total_area?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          view_count?: number | null
          virtual_tour_url?: string | null
        }
        Relationships: []
      }
      property_alerts: {
        Row: {
          active: boolean | null
          city: string | null
          created_at: string | null
          id: string
          max_area: number | null
          max_bedrooms: number | null
          max_price: number | null
          min_area: number | null
          min_bedrooms: number | null
          min_price: number | null
          property_type: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          max_area?: number | null
          max_bedrooms?: number | null
          max_price?: number | null
          min_area?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          property_type?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          city?: string | null
          created_at?: string | null
          id?: string
          max_area?: number | null
          max_bedrooms?: number | null
          max_price?: number | null
          min_area?: number | null
          min_bedrooms?: number | null
          min_price?: number | null
          property_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: number
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          id?: number
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          id?: number
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      visits: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string
          created_at: string | null
          id: string
          notes: string | null
          property_id: string | null
          status: string | null
          updated_at: string | null
          visit_date: string
          visit_time: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone: string
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date: string
          visit_time: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date?: string
          visit_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "visits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_configurations: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          headers: Json | null
          id: string
          name: string
          secret_key: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          name: string
          secret_key?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          headers?: Json | null
          id?: string
          name?: string
          secret_key?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          data: Json | null
          event_type: string
          id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_type: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_type?: string
          id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_clean_slug: {
        Args: { input_text: string }
        Returns: string
      }
      generate_property_code: {
        Args: { property_type: string }
        Returns: string
      }
      generate_property_slug: {
        Args: {
          property_type_input: string
          city_input: string
          title_input: string
          property_code_input?: string
        }
        Returns: string
      }
      increment_property_views: {
        Args: { property_id: string }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "user" | "corretor" | "admin"
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
    Enums: {
      user_role: ["user", "corretor", "admin"],
    },
  },
} as const
