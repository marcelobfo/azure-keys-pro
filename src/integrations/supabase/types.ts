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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_tenant_context: {
        Row: {
          created_at: string | null
          updated_at: string | null
          user_id: string
          viewing_tenant_id: string | null
        }
        Insert: {
          created_at?: string | null
          updated_at?: string | null
          user_id: string
          viewing_tenant_id?: string | null
        }
        Update: {
          created_at?: string | null
          updated_at?: string | null
          user_id?: string
          viewing_tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_tenant_context_viewing_tenant_id_fkey"
            columns: ["viewing_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      attendant_availability: {
        Row: {
          created_at: string
          current_chats: number
          id: string
          is_online: boolean
          last_seen: string
          max_concurrent_chats: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_chats?: number
          id?: string
          is_online?: boolean
          last_seen?: string
          max_concurrent_chats?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_chats?: number
          id?: string
          is_online?: boolean
          last_seen?: string
          max_concurrent_chats?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendant_availability_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
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
          evolution_api_key: string | null
          evolution_api_url: string | null
          evolution_instance: string | null
          gemini_api_key: string | null
          id: string
          knowledge_base_enabled: boolean | null
          max_tokens: number | null
          openai_api_key: string | null
          provider_model: string | null
          system_instruction: string | null
          temperature: number | null
          tenant_id: string | null
          top_p: number | null
          updated_at: string | null
          welcome_message: string | null
          whatsapp_enabled: boolean | null
          whatsapp_icon_url: string | null
          whatsapp_lead_welcome_message: string | null
          whatsapp_notification_number: string | null
          whatsapp_number: string | null
          whatsapp_position: string | null
        }
        Insert: {
          active?: boolean | null
          ai_chat_enabled?: boolean | null
          api_key_encrypted?: string | null
          api_provider?: string
          company: string
          created_at?: string | null
          custom_responses?: Json | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_instance?: string | null
          gemini_api_key?: string | null
          id?: string
          knowledge_base_enabled?: boolean | null
          max_tokens?: number | null
          openai_api_key?: string | null
          provider_model?: string | null
          system_instruction?: string | null
          temperature?: number | null
          tenant_id?: string | null
          top_p?: number | null
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_icon_url?: string | null
          whatsapp_lead_welcome_message?: string | null
          whatsapp_notification_number?: string | null
          whatsapp_number?: string | null
          whatsapp_position?: string | null
        }
        Update: {
          active?: boolean | null
          ai_chat_enabled?: boolean | null
          api_key_encrypted?: string | null
          api_provider?: string
          company?: string
          created_at?: string | null
          custom_responses?: Json | null
          evolution_api_key?: string | null
          evolution_api_url?: string | null
          evolution_instance?: string | null
          gemini_api_key?: string | null
          id?: string
          knowledge_base_enabled?: boolean | null
          max_tokens?: number | null
          openai_api_key?: string | null
          provider_model?: string | null
          system_instruction?: string | null
          temperature?: number | null
          tenant_id?: string | null
          top_p?: number | null
          updated_at?: string | null
          welcome_message?: string | null
          whatsapp_enabled?: boolean | null
          whatsapp_icon_url?: string | null
          whatsapp_lead_welcome_message?: string | null
          whatsapp_notification_number?: string | null
          whatsapp_number?: string | null
          whatsapp_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_configurations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_context_memory: {
        Row: {
          created_at: string
          id: string
          key: string
          session_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          session_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          session_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "chat_context_memory_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          id: string
          message: string
          read_at: string | null
          read_status: boolean
          sender_id: string | null
          sender_type: string
          session_id: string
          status: string
          timestamp: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          read_status?: boolean
          sender_id?: string | null
          sender_type: string
          session_id: string
          status?: string
          timestamp?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          read_status?: boolean
          sender_id?: string | null
          sender_type?: string
          session_id?: string
          status?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          attendant_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          lead_id: string
          notes: string | null
          started_at: string
          status: string
          subject: string | null
          tags: string[] | null
          ticket_id: string | null
          ticket_protocol: string | null
          updated_at: string
        }
        Insert: {
          attendant_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          started_at?: string
          status?: string
          subject?: string | null
          tags?: string[] | null
          ticket_id?: string | null
          ticket_protocol?: string | null
          updated_at?: string
        }
        Update: {
          attendant_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          started_at?: string
          status?: string
          subject?: string | null
          tags?: string[] | null
          ticket_id?: string | null
          ticket_protocol?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_attendant_id_fkey"
            columns: ["attendant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          commission_rate: number
          commission_value: number | null
          corretor_id: string
          created_at: string | null
          id: string
          lead_id: string | null
          notes: string | null
          payment_date: string | null
          property_id: string | null
          sale_date: string
          sale_price: number
          status: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          commission_rate?: number
          commission_value?: number | null
          corretor_id: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_date?: string | null
          property_id?: string | null
          sale_date?: string
          sale_price: number
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          commission_rate?: number
          commission_value?: number | null
          corretor_id?: string
          created_at?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_date?: string | null
          property_id?: string | null
          sale_date?: string
          sale_price?: number
          status?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      corretor_commission_settings: {
        Row: {
          corretor_id: string
          created_at: string | null
          default_rate: number
          id: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          corretor_id: string
          created_at?: string | null
          default_rate?: number
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          corretor_id?: string
          created_at?: string | null
          default_rate?: number
          id?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "corretor_commission_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      home_sections: {
        Row: {
          created_at: string | null
          display_order: number | null
          filter_field: string | null
          filter_type: string
          filter_value: string | null
          filters: Json | null
          id: string
          is_active: boolean | null
          max_items: number | null
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          filter_field?: string | null
          filter_type?: string
          filter_value?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          max_items?: number | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          filter_field?: string | null
          filter_type?: string
          filter_value?: string | null
          filters?: Json | null
          id?: string
          is_active?: boolean | null
          max_items?: number | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "home_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          content: string
          created_at: string | null
          id: string
          published: boolean | null
          tags: string[] | null
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          published?: boolean | null
          tags?: string[] | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          email: string | null
          external_id: string | null
          id: string
          message: string | null
          name: string
          olx_ad_id: string | null
          olx_link: string | null
          olx_list_id: string | null
          phone: string | null
          property_id: string | null
          source: string | null
          status: string | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          message?: string | null
          name: string
          olx_ad_id?: string | null
          olx_link?: string | null
          olx_list_id?: string | null
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          email?: string | null
          external_id?: string | null
          id?: string
          message?: string | null
          name?: string
          olx_ad_id?: string | null
          olx_link?: string | null
          olx_list_id?: string | null
          phone?: string | null
          property_id?: string | null
          source?: string | null
          status?: string | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      olx_integration: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          is_active: boolean | null
          scope: string | null
          tenant_id: string | null
          token_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scope?: string | null
          tenant_id?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          scope?: string | null
          tenant_id?: string | null
          token_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "olx_integration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      olx_settings: {
        Row: {
          auto_publish: boolean | null
          client_id: string
          client_secret: string
          created_at: string | null
          default_phone: string | null
          id: number
          lead_config_id: string | null
          lead_webhook_token: string | null
          lead_webhook_url: string | null
          redirect_uri: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          auto_publish?: boolean | null
          client_id: string
          client_secret: string
          created_at?: string | null
          default_phone?: string | null
          id?: number
          lead_config_id?: string | null
          lead_webhook_token?: string | null
          lead_webhook_url?: string | null
          redirect_uri: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          auto_publish?: boolean | null
          client_id?: string
          client_secret?: string
          created_at?: string | null
          default_phone?: string | null
          id?: number
          lead_config_id?: string | null
          lead_webhook_token?: string | null
          lead_webhook_url?: string | null
          redirect_uri?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "olx_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          accepts_exchange: boolean | null
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
          garage_spaces: number | null
          hide_address: boolean | null
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
          neighborhood: string | null
          olx_ad_id: string | null
          olx_error_message: string | null
          olx_last_sync: string | null
          olx_status: string | null
          owner_email: string | null
          owner_name: string | null
          owner_notes: string | null
          owner_phone: string | null
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
          tenant_id: string | null
          title: string
          total_area: number | null
          updated_at: string | null
          user_id: string | null
          video_url: string | null
          view_count: number | null
          virtual_tour_url: string | null
          zipcode: string | null
        }
        Insert: {
          accepts_exchange?: boolean | null
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
          garage_spaces?: number | null
          hide_address?: boolean | null
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
          neighborhood?: string | null
          olx_ad_id?: string | null
          olx_error_message?: string | null
          olx_last_sync?: string | null
          olx_status?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_notes?: string | null
          owner_phone?: string | null
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
          tenant_id?: string | null
          title: string
          total_area?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          view_count?: number | null
          virtual_tour_url?: string | null
          zipcode?: string | null
        }
        Update: {
          accepts_exchange?: boolean | null
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
          garage_spaces?: number | null
          hide_address?: boolean | null
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
          neighborhood?: string | null
          olx_ad_id?: string | null
          olx_error_message?: string | null
          olx_last_sync?: string | null
          olx_status?: string | null
          owner_email?: string | null
          owner_name?: string | null
          owner_notes?: string | null
          owner_phone?: string | null
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
          tenant_id?: string | null
          title?: string
          total_area?: number | null
          updated_at?: string | null
          user_id?: string | null
          video_url?: string | null
          view_count?: number | null
          virtual_tour_url?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      property_tags: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: number
          key: string
          tenant_id: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          id?: number
          key: string
          tenant_id?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          id?: number
          key?: string
          tenant_id?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          id: string
          lead_id: string | null
          priority: string
          protocol_number: string | null
          resolved_at: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          protocol_number?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          protocol_number?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_features: {
        Row: {
          chat_enabled: boolean | null
          commissions_enabled: boolean | null
          created_at: string | null
          evolution_enabled: boolean | null
          id: string
          leads_enabled: boolean | null
          max_properties: number | null
          max_users: number | null
          olx_enabled: boolean | null
          tenant_id: string
          updated_at: string | null
          whatsapp_enabled: boolean | null
        }
        Insert: {
          chat_enabled?: boolean | null
          commissions_enabled?: boolean | null
          created_at?: string | null
          evolution_enabled?: boolean | null
          id?: string
          leads_enabled?: boolean | null
          max_properties?: number | null
          max_users?: number | null
          olx_enabled?: boolean | null
          tenant_id: string
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Update: {
          chat_enabled?: boolean | null
          commissions_enabled?: boolean | null
          created_at?: string | null
          evolution_enabled?: boolean | null
          id?: string
          leads_enabled?: boolean | null
          max_properties?: number | null
          max_users?: number | null
          olx_enabled?: boolean | null
          tenant_id?: string
          updated_at?: string | null
          whatsapp_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_features_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          contact_email: string | null
          created_at: string | null
          domain: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          redirect_url: string | null
          secondary_color: string | null
          settings: Json | null
          slug: string
          subdomain: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          contact_email?: string | null
          created_at?: string | null
          domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          redirect_url?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug: string
          subdomain?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          contact_email?: string | null
          created_at?: string | null
          domain?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          redirect_url?: string | null
          secondary_color?: string | null
          settings?: Json | null
          slug?: string
          subdomain?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          tenant_id: string | null
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
          tenant_id?: string | null
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
          tenant_id?: string | null
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
          {
            foreignKeyName: "visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      authorize: {
        Args: { required_role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      authorize_any: {
        Args: { required_roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      can_access_lead:
        | { Args: { lead_property_id: string }; Returns: boolean }
        | {
            Args: { lead_assigned_to?: string; lead_property_id: string }
            Returns: boolean
          }
      can_access_notification: {
        Args: { notif_data: Json; notif_type: string; notif_user_id: string }
        Returns: boolean
      }
      can_access_profile: {
        Args: { profile_tenant_id: string }
        Returns: boolean
      }
      can_access_property: { Args: { prop_user_id: string }; Returns: boolean }
      can_access_visit: {
        Args: { visit_property_id: string }
        Returns: boolean
      }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      generate_clean_slug: { Args: { input_text: string }; Returns: string }
      generate_property_code: {
        Args: { property_type: string }
        Returns: string
      }
      generate_property_slug: {
        Args: {
          city_input: string
          property_code_input?: string
          property_type_input: string
          title_input: string
        }
        Returns: string
      }
      generate_protocol_number: { Args: never; Returns: string }
      generate_secure_token: { Args: never; Returns: string }
      get_effective_tenant_id: { Args: never; Returns: string }
      get_public_chat_config: {
        Args: never
        Returns: {
          active: boolean
          ai_chat_enabled: boolean
          api_provider: string
          company: string
          created_at: string
          custom_responses: Json
          id: string
          knowledge_base_enabled: boolean
          max_tokens: number
          provider_model: string
          system_instruction: string
          temperature: number
          top_p: number
          updated_at: string
          welcome_message: string
          whatsapp_enabled: boolean
          whatsapp_number: string
        }[]
      }
      get_site_context_for_ai: { Args: never; Returns: Json }
      get_tenant_id_by_domain: {
        Args: { domain_input: string }
        Returns: string
      }
      get_user_email: { Args: { user_id: string }; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_tenant: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _tenant_id: string
          _user_id: string
        }
        Returns: boolean
      }
      hash_token: { Args: { token: string }; Returns: string }
      increment_property_views: {
        Args: { property_id: string }
        Returns: undefined
      }
      is_business_hours: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      search_properties_for_ai: {
        Args: {
          city_filter?: string
          limit_count?: number
          max_bedrooms_filter?: number
          max_price_filter?: number
          min_bedrooms_filter?: number
          min_price_filter?: number
          property_type_filter?: string
        }
        Returns: Json
      }
      verify_token: { Args: { hash: string; token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "user" | "corretor" | "admin" | "super_admin"
      user_role: "user" | "corretor" | "admin" | "master"
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
      app_role: ["user", "corretor", "admin", "super_admin"],
      user_role: ["user", "corretor", "admin", "master"],
    },
  },
} as const
