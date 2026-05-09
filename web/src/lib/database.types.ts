export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Matches Phase 2 migrations; regenerate with `supabase gen types typescript` when the DB is available. */
export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          auth_user_id: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          auth_user_id: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          auth_user_id?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          public_session_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          organization: string | null
          source: string
          primary_type: string | null
          secondary_types: string[] | null
          status: string
          review_status: string
          ai_summary: string | null
          raw_intent: string | null
          profile_confidence: number | null
          bad_fit_risk: string | null
          intro_draft: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          public_session_id: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          organization?: string | null
          source?: string
          primary_type?: string | null
          secondary_types?: string[] | null
          status?: string
          review_status?: string
          ai_summary?: string | null
          raw_intent?: string | null
          profile_confidence?: number | null
          bad_fit_risk?: string | null
          intro_draft?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          public_session_id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          organization?: string | null
          source?: string
          primary_type?: string | null
          secondary_types?: string[] | null
          status?: string
          review_status?: string
          ai_summary?: string | null
          raw_intent?: string | null
          profile_confidence?: number | null
          bad_fit_risk?: string | null
          intro_draft?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_profile_fields: {
        Row: {
          id: string
          lead_id: string
          field_key: string
          field_value: Json | null
          confidence: number | null
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          field_key: string
          field_value?: Json | null
          confidence?: number | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          field_key?: string
          field_value?: Json | null
          confidence?: number | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      intake_messages: {
        Row: {
          id: string
          lead_id: string
          sender: string
          message: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          sender: string
          message: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          sender?: string
          message?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          id: string
          lead_id: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          organization: string | null
          title: string | null
          bio: string | null
          person_types: string[] | null
          sectors: string[] | null
          skills: string[] | null
          availability: string[] | null
          stage_preferences: string[] | null
          engagement_preferences: string[] | null
          source: string
          status: string
          embedding_text: string | null
          embedding: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          organization?: string | null
          title?: string | null
          bio?: string | null
          person_types?: string[] | null
          sectors?: string[] | null
          skills?: string[] | null
          availability?: string[] | null
          stage_preferences?: string[] | null
          engagement_preferences?: string[] | null
          source?: string
          status?: string
          embedding_text?: string | null
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          organization?: string | null
          title?: string | null
          bio?: string | null
          person_types?: string[] | null
          sectors?: string[] | null
          skills?: string[] | null
          availability?: string[] | null
          stage_preferences?: string[] | null
          engagement_preferences?: string[] | null
          source?: string
          status?: string
          embedding_text?: string | null
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          organization: string | null
          sector: string[] | null
          stage: string | null
          need_types: string[] | null
          status: string
          source: string
          contact_email: string | null
          embedding_text: string | null
          embedding: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          organization?: string | null
          sector?: string[] | null
          stage?: string | null
          need_types?: string[] | null
          status?: string
          source?: string
          contact_email?: string | null
          embedding_text?: string | null
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          organization?: string | null
          sector?: string[] | null
          stage?: string | null
          need_types?: string[] | null
          status?: string
          source?: string
          contact_email?: string | null
          embedding_text?: string | null
          embedding?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_records: {
        Row: {
          id: string
          lead_id: string
          person_id: string | null
          opportunity_id: string | null
          matched_record_type: string
          matched_record_id: string
          overall_score: number | null
          confidence_label: string | null
          why_this_fits: string | null
          best_next_step: string | null
          potential_gap: string | null
          score_breakdown: Json | null
          status: string
          intro_email_draft: string | null
          intro_sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          person_id?: string | null
          opportunity_id?: string | null
          matched_record_type: string
          matched_record_id: string
          overall_score?: number | null
          confidence_label?: string | null
          why_this_fits?: string | null
          best_next_step?: string | null
          potential_gap?: string | null
          score_breakdown?: Json | null
          status?: string
          intro_email_draft?: string | null
          intro_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          person_id?: string | null
          opportunity_id?: string | null
          matched_record_type?: string
          matched_record_id?: string
          overall_score?: number | null
          confidence_label?: string | null
          why_this_fits?: string | null
          best_next_step?: string | null
          potential_gap?: string | null
          score_breakdown?: Json | null
          status?: string
          intro_email_draft?: string | null
          intro_sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          id: string
          lead_id: string
          admin_user_id: string | null
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          admin_user_id?: string | null
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          admin_user_id?: string | null
          note?: string
          created_at?: string
        }
        Relationships: []
      }
      csv_imports: {
        Row: {
          id: string
          admin_user_id: string | null
          file_name: string | null
          status: string
          detected_import_type: string | null
          column_mapping: Json | null
          row_count: number | null
          error_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          admin_user_id?: string | null
          file_name?: string | null
          status?: string
          detected_import_type?: string | null
          column_mapping?: Json | null
          row_count?: number | null
          error_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string | null
          file_name?: string | null
          status?: string
          detected_import_type?: string | null
          column_mapping?: Json | null
          row_count?: number | null
          error_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      csv_import_rows: {
        Row: {
          id: string
          csv_import_id: string
          row_index: number | null
          raw_data: Json | null
          mapped_data: Json | null
          status: string
          error_message: string | null
          created_record_type: string | null
          created_record_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          csv_import_id: string
          row_index?: number | null
          raw_data?: Json | null
          mapped_data?: Json | null
          status?: string
          error_message?: string | null
          created_record_type?: string | null
          created_record_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          csv_import_id?: string
          row_index?: number | null
          raw_data?: Json | null
          mapped_data?: Json | null
          status?: string
          error_message?: string | null
          created_record_type?: string | null
          created_record_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      introduction_requests: {
        Row: {
          id: string
          lead_id: string
          match_record_id: string | null
          request_kind: string
          target_title: string
          matched_record_type: string | null
          matched_record_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          match_record_id?: string | null
          request_kind: string
          target_title: string
          matched_record_type?: string | null
          matched_record_id?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          match_record_id?: string | null
          request_kind?: string
          target_title?: string
          matched_record_type?: string | null
          matched_record_id?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'introduction_requests_lead_id_fkey'
            columns: ['lead_id']
            isOneToOne: false
            referencedRelation: 'leads'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'introduction_requests_match_record_id_fkey'
            columns: ['match_record_id']
            isOneToOne: false
            referencedRelation: 'match_records'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      create_public_lead: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_email: string
          p_public_session_id: string
        }
        Returns: string
      }
      get_lead_for_session: {
        Args: { p_lead_id: string; p_public_session_id: string }
        Returns: Database['public']['Tables']['leads']['Row'][]
      }
      update_public_lead: {
        Args: {
          p_lead_id: string
          p_public_session_id: string
          p_raw_intent?: string | null
          p_status?: string | null
          p_primary_type?: string | null
          p_secondary_types?: string[] | null
          p_ai_summary?: string | null
          p_profile_confidence?: number | null
          p_bad_fit_risk?: string | null
          p_review_status?: string | null
          p_first_name?: string | null
          p_last_name?: string | null
          p_email?: string | null
        }
        Returns: boolean
      }
      append_intake_message: {
        Args: {
          p_lead_id: string
          p_public_session_id: string
          p_sender: string
          p_message: string
          p_metadata?: Json | null
        }
        Returns: string
      }
      upsert_lead_profile_field: {
        Args: {
          p_lead_id: string
          p_public_session_id: string
          p_field_key: string
          p_field_value: Json
          p_confidence?: number | null
          p_source?: string | null
        }
        Returns: string
      }
      list_intake_messages_for_session: {
        Args: { p_lead_id: string; p_public_session_id: string }
        Returns: Database['public']['Tables']['intake_messages']['Row'][]
      }
      list_lead_profile_fields_for_session: {
        Args: { p_lead_id: string; p_public_session_id: string }
        Returns: Database['public']['Tables']['lead_profile_fields']['Row'][]
      }
      list_match_records_for_session: {
        Args: { p_lead_id: string; p_public_session_id: string }
        Returns: {
          match_id: string
          matched_record_type: string
          overall_score: number | null
          confidence_label: string | null
          why_this_fits: string | null
          best_next_step: string | null
          potential_gap: string | null
          score_breakdown: Json | null
          card_title: string
          match_kind_label: string
          icon_kind: string
        }[]
      }
      create_introduction_request: {
        Args: {
          p_lead_id: string
          p_public_session_id: string
          p_request_kind: string
          p_target_title: string
          p_match_record_id?: string | null
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
