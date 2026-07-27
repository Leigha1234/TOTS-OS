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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          name: string
          organisation_id: string | null
          tenant_id: string | null
          type: string
        }
        Insert: {
          id?: string
          name: string
          organisation_id?: string | null
          tenant_id?: string | null
          type: string
        }
        Update: {
          id?: string
          name?: string
          organisation_id?: string | null
          tenant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      activity: {
        Row: {
          action: string | null
          created_at: string | null
          entity: string | null
          entity_id: string | null
          id: string
          organisation_id: string | null
          profile_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          organisation_id?: string | null
          profile_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          organisation_id?: string | null
          profile_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          organisation_id: string | null
          severity: string | null
          source: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          organisation_id?: string | null
          severity?: string | null
          source?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          organisation_id?: string | null
          severity?: string | null
          source?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      artifacts: {
        Row: {
          created_at: string
          file_type: string | null
          id: string
          name: string
          organisation_id: string | null
          parent_id: string
          size: number | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          file_type?: string | null
          id?: string
          name: string
          organisation_id?: string | null
          parent_id: string
          size?: number | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          file_type?: string | null
          id?: string
          name?: string
          organisation_id?: string | null
          parent_id?: string
          size?: number | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          organisation_id: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organisation_id?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          organisation_id?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      campaign_clicks: {
        Row: {
          campaign_id: string | null
          clicked_at: string | null
          id: string
          ip: string | null
          organisation_id: string | null
          profile_id: string | null
          url: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          clicked_at?: string | null
          id?: string
          ip?: string | null
          organisation_id?: string | null
          profile_id?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          clicked_at?: string | null
          id?: string
          ip?: string | null
          organisation_id?: string | null
          profile_id?: string | null
          url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_opens: {
        Row: {
          campaign_id: string | null
          id: string
          ip: string | null
          opened_at: string | null
          organisation_id: string | null
          profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          ip?: string | null
          opened_at?: string | null
          organisation_id?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          id?: string
          ip?: string | null
          opened_at?: string | null
          organisation_id?: string | null
          profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          content: string | null
          created_at: string | null
          error: string | null
          id: string
          last_attempt_at: string | null
          list_id: string | null
          open_count: number | null
          open_rate: number | null
          organisation_id: string
          scheduled_for: string | null
          send_attempts: number | null
          sent_at: string | null
          status: string | null
          subject: string | null
          team_id: string | null
          template_id: string | null
          title: string | null
          total_clicked: number | null
          total_opened: number | null
          total_sent: number | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          last_attempt_at?: string | null
          list_id?: string | null
          open_count?: number | null
          open_rate?: number | null
          organisation_id: string
          scheduled_for?: string | null
          send_attempts?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          team_id?: string | null
          template_id?: string | null
          title?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          error?: string | null
          id?: string
          last_attempt_at?: string | null
          list_id?: string | null
          open_count?: number | null
          open_rate?: number | null
          organisation_id?: string
          scheduled_for?: string | null
          send_attempts?: number | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          team_id?: string | null
          template_id?: string | null
          title?: string | null
          total_clicked?: number | null
          total_opened?: number | null
          total_sent?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "subscriber_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      clarity_chats: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          project_id: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clarity_chats_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "clarity_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clarity_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string | null
          id: string
          organisation_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clarity_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "clarity_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      clarity_projects: {
        Row: {
          created_at: string | null
          id: string
          name: string
          organisation_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string
          organisation_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          organisation_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      clarity_scans: {
        Row: {
          created_at: string | null
          id: string
          insight_text: string | null
          organisation_id: string | null
          project_id: string | null
          scan_type: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          insight_text?: string | null
          organisation_id?: string | null
          project_id?: string | null
          scan_type?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          insight_text?: string | null
          organisation_id?: string | null
          project_id?: string | null
          scan_type?: string | null
          team_id?: string
        }
        Relationships: []
      }
      client_users: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string | null
          id: string
          organisation_id: string | null
          password: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          organisation_id?: string | null
          password?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          organisation_id?: string | null
          password?: string | null
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          organisation_id: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contact_timeline: {
        Row: {
          contact_id: string
          content: string | null
          created_at: string | null
          id: string
          organisation_id: string
          title: string | null
          type: string
        }
        Insert: {
          contact_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id: string
          title?: string | null
          type: string
        }
        Update: {
          contact_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id?: string
          title?: string | null
          type?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          attachments: string | null
          company_details: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          organisation_id: string
          phone: string | null
          role: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          attachments?: string | null
          company_details?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          organisation_id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          attachments?: string | null
          company_details?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          organisation_id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          client_type: string | null
          company: string | null
          created_at: string | null
          email: string | null
          id: string
          invoice_count: number | null
          mailing_list_category: string | null
          message_count: number | null
          name: string | null
          notes: string | null
          on_mailing_list: boolean | null
          organisation_id: string | null
          password: string | null
          phone: string | null
          project_count: number | null
          stage: string | null
          status: string | null
          tags: string[] | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          client_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          invoice_count?: number | null
          mailing_list_category?: string | null
          message_count?: number | null
          name?: string | null
          notes?: string | null
          on_mailing_list?: boolean | null
          organisation_id?: string | null
          password?: string | null
          phone?: string | null
          project_count?: number | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          client_type?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          invoice_count?: number | null
          mailing_list_category?: string | null
          message_count?: number | null
          name?: string | null
          notes?: string | null
          on_mailing_list?: boolean | null
          organisation_id?: string | null
          password?: string | null
          phone?: string | null
          project_count?: number | null
          stage?: string | null
          status?: string | null
          tags?: string[] | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboards: {
        Row: {
          created_at: string | null
          id: string
          layout: Json | null
          name: string | null
          organisation_id: string | null
          team_id: string | null
          user_id: string | null
          visible: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          layout?: Json | null
          name?: string | null
          organisation_id?: string | null
          team_id?: string | null
          user_id?: string | null
          visible?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          layout?: Json | null
          name?: string | null
          organisation_id?: string | null
          team_id?: string | null
          user_id?: string | null
          visible?: Json | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          list_id: string | null
          organisation_id: string | null
          scheduled_for: string | null
          subject: string | null
          team_id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          list_id?: string | null
          organisation_id?: string | null
          scheduled_for?: string | null
          subject?: string | null
          team_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          list_id?: string | null
          organisation_id?: string | null
          scheduled_for?: string | null
          subject?: string | null
          team_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaigns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string
          created_at: string | null
          event_type: string
          id: string
          organisation_id: string | null
          profile_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          event_type: string
          id?: string
          organisation_id?: string | null
          profile_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          event_type?: string
          id?: string
          organisation_id?: string | null
          profile_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email: string | null
          error: string | null
          id: string
          organisation_id: string | null
          profile_id: string | null
          status: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email?: string | null
          error?: string | null
          id?: string
          organisation_id?: string | null
          profile_id?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email?: string | null
          error?: string | null
          id?: string
          organisation_id?: string | null
          profile_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          attachment_url: string | null
          body: string | null
          created_at: string | null
          direction: string | null
          from_email: string | null
          id: string
          organisation_id: string
          profile_id: string
          status: string | null
          subject: string | null
          thread_id: string
        }
        Insert: {
          attachment_url?: string | null
          body?: string | null
          created_at?: string | null
          direction?: string | null
          from_email?: string | null
          id?: string
          organisation_id: string
          profile_id: string
          status?: string | null
          subject?: string | null
          thread_id: string
        }
        Update: {
          attachment_url?: string | null
          body?: string | null
          created_at?: string | null
          direction?: string | null
          from_email?: string | null
          id?: string
          organisation_id?: string
          profile_id?: string
          status?: string | null
          subject?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          assigned_name: string | null
          assigned_to: string | null
          contact_id: string | null
          created_at: string | null
          id: string
          last_direction: string | null
          last_message_at: string | null
          last_preview: string | null
          organisation_id: string
          profile_id: string
          status: string | null
          subject: string | null
          unread_count: number | null
        }
        Insert: {
          assigned_name?: string | null
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_direction?: string | null
          last_message_at?: string | null
          last_preview?: string | null
          organisation_id: string
          profile_id: string
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Update: {
          assigned_name?: string | null
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          id?: string
          last_direction?: string | null
          last_message_at?: string | null
          last_preview?: string | null
          organisation_id?: string
          profile_id?: string
          status?: string | null
          subject?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_threads_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_email_threads_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          attachment_url: string | null
          body: string
          created_at: string
          id: string
          organisation_id: string
          profile_id: string
          recipient_email: string | null
          status: string
          subject: string
        }
        Insert: {
          attachment_url?: string | null
          body: string
          created_at?: string
          id?: string
          organisation_id: string
          profile_id: string
          recipient_email?: string | null
          status?: string
          subject: string
        }
        Update: {
          attachment_url?: string | null
          body?: string
          created_at?: string
          id?: string
          organisation_id?: string
          profile_id?: string
          recipient_email?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          id: string
          name: string
          ni_number: string
          organisation_id: string | null
          salary: number
          tenant_id: string | null
        }
        Insert: {
          id?: string
          name: string
          ni_number: string
          organisation_id?: string | null
          salary: number
          tenant_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          ni_number?: string
          organisation_id?: string | null
          salary?: number
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      end_of_year: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_id: string | null
          data: Json | null
          doc_type: string | null
          due_date: string | null
          id: string
          interval: string | null
          items: Json | null
          link: string | null
          organisation_id: string | null
          recurring: boolean | null
          status: string | null
          tax: number | null
          team_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          doc_type?: string | null
          due_date?: string | null
          id?: string
          interval?: string | null
          items?: Json | null
          link?: string | null
          organisation_id?: string | null
          recurring?: boolean | null
          status?: string | null
          tax?: number | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          doc_type?: string | null
          due_date?: string | null
          id?: string
          interval?: string | null
          items?: Json | null
          link?: string | null
          organisation_id?: string | null
          recurring?: boolean | null
          status?: string | null
          tax?: number | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string | null
          guests: string | null
          id: string
          location: string | null
          meeting_link: string | null
          organisation_id: string | null
          repeat: string | null
          source: string | null
          start_time: string | null
          tags: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          guests?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          organisation_id?: string | null
          repeat?: string | null
          source?: string | null
          start_time?: string | null
          tags?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          guests?: string | null
          id?: string
          location?: string | null
          meeting_link?: string | null
          organisation_id?: string | null
          repeat?: string | null
          source?: string | null
          start_time?: string | null
          tags?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          attachment_url: string | null
          client_name: string | null
          created_at: string
          date: string | null
          description: string | null
          id: string
          organisation_id: string | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          client_name?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          client_name?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string | null
          customer_id: string | null
          id: string
          name: string | null
          organisation_id: string | null
          task_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          name?: string | null
          organisation_id?: string | null
          task_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          id?: string
          name?: string | null
          organisation_id?: string | null
          task_id?: string | null
          url?: string | null
        }
        Relationships: []
      }
      gmail_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          email: string | null
          expiry: string | null
          id: string
          organisation_id: string | null
          refresh_token: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          expiry?: string | null
          id?: string
          organisation_id?: string | null
          refresh_token?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          email?: string | null
          expiry?: string | null
          id?: string
          organisation_id?: string | null
          refresh_token?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          organisation_id: string | null
          role: string | null
          status: string | null
          stripe_session_id: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          organisation_id?: string | null
          role?: string | null
          status?: string | null
          stripe_session_id?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          organisation_id?: string | null
          role?: string | null
          status?: string | null
          stripe_session_id?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          description: string
          id: string
          invoice_id: string | null
          organisation_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          invoice_id?: string | null
          organisation_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          invoice_id?: string | null
          organisation_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number | null
          created_at: string | null
          customer_id: string | null
          data: Json | null
          doc_type: string | null
          due_date: string | null
          id: string
          interval: string | null
          items: Json | null
          link: string | null
          organisation_id: string | null
          recurring: boolean | null
          status: string | null
          tax: number | null
          team_id: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          doc_type?: string | null
          due_date?: string | null
          id?: string
          interval?: string | null
          items?: Json | null
          link?: string | null
          organisation_id?: string | null
          recurring?: boolean | null
          status?: string | null
          tax?: number | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          customer_id?: string | null
          data?: Json | null
          doc_type?: string | null
          due_date?: string | null
          id?: string
          interval?: string | null
          items?: Json | null
          link?: string | null
          organisation_id?: string | null
          recurring?: boolean | null
          status?: string | null
          tax?: number | null
          team_id?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          payload: Json | null
          status: string | null
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          payload?: Json | null
          status?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          payload?: Json | null
          status?: string | null
          type?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          description: string
          id: string
          organisation_id: string | null
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          organisation_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          organisation_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string | null
          credit: number | null
          debit: number | null
          id: string
          journal_id: string | null
          organisation_id: string | null
        }
        Insert: {
          account_id?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_id?: string | null
          organisation_id?: string | null
        }
        Update: {
          account_id?: string | null
          credit?: number | null
          debit?: number | null
          id?: string
          journal_id?: string | null
          organisation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_lines_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      list_subscribers: {
        Row: {
          created_at: string | null
          id: string
          list_id: string | null
          organisation_id: string | null
          profile_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          organisation_id?: string | null
          profile_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          list_id?: string | null
          organisation_id?: string | null
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_subscribers_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "subscriber_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_subscribers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mentions: {
        Row: {
          created_at: string | null
          id: string
          mentioned_user_id: string | null
          organisation_id: string | null
          task_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string | null
          organisation_id?: string | null
          task_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mentioned_user_id?: string | null
          organisation_id?: string | null
          task_id?: string | null
        }
        Relationships: []
      }
      note_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          organisation_id: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_comment_fk"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "note_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      note_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          note_id: string
          organisation_id: string | null
          parent_id: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          note_id: string
          organisation_id?: string | null
          parent_id?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          note_id?: string
          organisation_id?: string | null
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "note_comments_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "note_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "note_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          assigned_to: string[] | null
          attachments: Json | null
          category: string | null
          color: string | null
          completed: boolean | null
          contact_id: string | null
          content: string
          created_at: string | null
          due_date: string | null
          end_date: string | null
          id: string
          is_reminder: boolean | null
          is_urgent: boolean | null
          organisation_id: string
          project: string | null
          start_date: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string
          visibility: Database["public"]["Enums"]["note_visibility"] | null
        }
        Insert: {
          assigned_to?: string[] | null
          attachments?: Json | null
          category?: string | null
          color?: string | null
          completed?: boolean | null
          contact_id?: string | null
          content: string
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          is_reminder?: boolean | null
          is_urgent?: boolean | null
          organisation_id: string
          project?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: Database["public"]["Enums"]["note_visibility"] | null
        }
        Update: {
          assigned_to?: string[] | null
          attachments?: Json | null
          category?: string | null
          color?: string | null
          completed?: boolean | null
          contact_id?: string | null
          content?: string
          created_at?: string | null
          due_date?: string | null
          end_date?: string | null
          id?: string
          is_reminder?: boolean | null
          is_urgent?: boolean | null
          organisation_id?: string
          project?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: Database["public"]["Enums"]["note_visibility"] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_notes_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          organisation_id: string | null
          read: boolean | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          read?: boolean | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          read?: boolean | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      organisation_social_accounts: {
        Row: {
          access_token: string
          created_at: string | null
          id: string
          ig_user_id: string | null
          organisation_id: string
          platform: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          id?: string
          ig_user_id?: string | null
          organisation_id: string
          platform: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          id?: string
          ig_user_id?: string | null
          organisation_id?: string
          platform?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          available_seats: number | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          available_seats?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          available_seats?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      page_connections: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          page_access_token: string
          page_id: string
          page_name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          page_access_token: string
          page_id: string
          page_name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          page_access_token?: string
          page_id?: string
          page_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          organisation_id: string | null
          paid_at: string | null
          status: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organisation_id?: string | null
          paid_at?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organisation_id?: string | null
          paid_at?: string | null
          status?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          bonus: number | null
          created_at: string | null
          employee: string | null
          id: string
          organisation_id: string | null
          pay_date: string | null
          salary: number | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          bonus?: number | null
          created_at?: string | null
          employee?: string | null
          id?: string
          organisation_id?: string | null
          pay_date?: string | null
          salary?: number | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          bonus?: number | null
          created_at?: string | null
          employee?: string | null
          id?: string
          organisation_id?: string | null
          pay_date?: string | null
          salary?: number | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: []
      }
      payroll_employees: {
        Row: {
          id: string
          name: string | null
          ni_number: string | null
          organisation_id: string | null
          pension_enrolled: boolean | null
          role: string | null
          salary_gross: number | null
          tax_code: string | null
          team_id: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          ni_number?: string | null
          organisation_id?: string | null
          pension_enrolled?: boolean | null
          role?: string | null
          salary_gross?: number | null
          tax_code?: string | null
          team_id?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          ni_number?: string | null
          organisation_id?: string | null
          pension_enrolled?: boolean | null
          role?: string | null
          salary_gross?: number | null
          tax_code?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_ledger: {
        Row: {
          amount: number | null
          employee_name: string | null
          id: string
          organisation_id: string | null
          pay_date: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          employee_name?: string | null
          id?: string
          organisation_id?: string | null
          pay_date?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          employee_name?: string | null
          id?: string
          organisation_id?: string | null
          pay_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      payslips: {
        Row: {
          employee_id: string | null
          gross: number
          id: string
          net: number
          ni: number
          organisation_id: string | null
          period_end: string
          period_start: string
          tax: number
        }
        Insert: {
          employee_id?: string | null
          gross: number
          id?: string
          net: number
          ni: number
          organisation_id?: string | null
          period_end: string
          period_start: string
          tax: number
        }
        Update: {
          employee_id?: string | null
          gross?: number
          id?: string
          net?: number
          ni?: number
          organisation_id?: string | null
          period_end?: string
          period_start?: string
          tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pensions: {
        Row: {
          amount: number
          created_at: string
          date: string | null
          description: string | null
          id: string
          organisation_id: string | null
          team_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          team_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pensions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          can_access: boolean | null
          id: string
          organisation_id: string | null
          page_slug: string
          user_id: string | null
        }
        Insert: {
          can_access?: boolean | null
          id?: string
          organisation_id?: string | null
          page_slug: string
          user_id?: string | null
        }
        Update: {
          can_access?: boolean | null
          id?: string
          organisation_id?: string | null
          page_slug?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_logs: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          platform: string | null
          post_id: string | null
          response: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          platform?: string | null
          post_id?: string | null
          response?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          platform?: string | null
          post_id?: string | null
          response?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments: number | null
          content: string | null
          created_at: string
          id: string
          likes: number | null
          organisation_id: string | null
          platform: string | null
          profile_id: string | null
          reach: number | null
          scheduled_for: string | null
          shares: number | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          comments?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes?: number | null
          organisation_id?: string | null
          platform?: string | null
          profile_id?: string | null
          reach?: number | null
          scheduled_for?: string | null
          shares?: number | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          comments?: number | null
          content?: string | null
          created_at?: string
          id?: string
          likes?: number | null
          organisation_id?: string | null
          platform?: string | null
          profile_id?: string | null
          reach?: number | null
          scheduled_for?: string | null
          shares?: number | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_subscriber_lists: {
        Row: {
          contact_id: string | null
          created_at: string | null
          id: string
          list_id: string | null
          organisation_id: string | null
          profile_id: string | null
          subscriber_list_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          list_id?: string | null
          organisation_id?: string | null
          profile_id?: string | null
          subscriber_list_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          id?: string
          list_id?: string | null
          organisation_id?: string | null
          profile_id?: string | null
          subscriber_list_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_subscriber_lists_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_subscriber_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "subscriber_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_subscriber_lists_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_subscriber_lists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_number: string | null
          active: boolean | null
          address: string | null
          avatar_url: string | null
          bank_name: string | null
          bio: string | null
          brand_color: string | null
          company_details: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          email_list: boolean | null
          email_signature: string | null
          font_family: string | null
          full_name: string | null
          id: string
          is_subscribed: boolean | null
          logo_url: string | null
          mobile_nav_config: string[] | null
          name: string | null
          next_of_kin: string | null
          next_of_kin_phone: string | null
          organisation_id: string | null
          phone: string | null
          referral_code: string | null
          role: string | null
          secondary_color: string | null
          sort_code: string | null
          subscriber_list_id: string | null
          subscription_tier: string | null
          team_seats_allocated: number | null
          tier: string | null
          updated_at: string | null
          xp: number | null
        }
        Insert: {
          account_number?: string | null
          active?: boolean | null
          address?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          bio?: string | null
          brand_color?: string | null
          company_details?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          email_list?: boolean | null
          email_signature?: string | null
          font_family?: string | null
          full_name?: string | null
          id?: string
          is_subscribed?: boolean | null
          logo_url?: string | null
          mobile_nav_config?: string[] | null
          name?: string | null
          next_of_kin?: string | null
          next_of_kin_phone?: string | null
          organisation_id?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          secondary_color?: string | null
          sort_code?: string | null
          subscriber_list_id?: string | null
          subscription_tier?: string | null
          team_seats_allocated?: number | null
          tier?: string | null
          updated_at?: string | null
          xp?: number | null
        }
        Update: {
          account_number?: string | null
          active?: boolean | null
          address?: string | null
          avatar_url?: string | null
          bank_name?: string | null
          bio?: string | null
          brand_color?: string | null
          company_details?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          email_list?: boolean | null
          email_signature?: string | null
          font_family?: string | null
          full_name?: string | null
          id?: string
          is_subscribed?: boolean | null
          logo_url?: string | null
          mobile_nav_config?: string[] | null
          name?: string | null
          next_of_kin?: string | null
          next_of_kin_phone?: string | null
          organisation_id?: string | null
          phone?: string | null
          referral_code?: string | null
          role?: string | null
          secondary_color?: string | null
          sort_code?: string | null
          subscriber_list_id?: string | null
          subscription_tier?: string | null
          team_seats_allocated?: number | null
          tier?: string | null
          updated_at?: string | null
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_subscriber_list_id_fkey"
            columns: ["subscriber_list_id"]
            isOneToOne: false
            referencedRelation: "subscriber_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignee_name: string | null
          created_at: string
          due_date: string | null
          id: string
          name: string
          organisation_id: string | null
          priority: string | null
          project_id: string | null
          status: string | null
        }
        Insert: {
          assignee_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          organisation_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
        }
        Update: {
          assignee_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          organisation_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          category: string | null
          created_at: string | null
          deleted_at: string | null
          description: string | null
          due_date: string | null
          health: string | null
          id: string
          members: string[] | null
          name: string
          objective_summary: string | null
          organisation_id: string
          priority: string | null
          start_date: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          health?: string | null
          id?: string
          members?: string[] | null
          name: string
          objective_summary?: string | null
          organisation_id: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          category?: string | null
          created_at?: string | null
          deleted_at?: string | null
          description?: string | null
          due_date?: string | null
          health?: string | null
          id?: string
          members?: string[] | null
          name?: string
          objective_summary?: string | null
          organisation_id?: string
          priority?: string | null
          start_date?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          amount: number
          client_name: string | null
          created_at: string
          date: string | null
          description: string | null
          id: string
          organisation_id: string | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          amount: number
          client_name?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          amount?: number
          client_name?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          attachment_url: string | null
          client_name: string | null
          created_at: string
          date: string | null
          description: string | null
          id: string
          organisation_id: string | null
          team_id: string | null
        }
        Insert: {
          amount: number
          attachment_url?: string | null
          client_name?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          team_id?: string | null
        }
        Update: {
          amount?: number
          attachment_url?: string | null
          client_name?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          new_user_id: string | null
          organisation_id: string | null
          referrer_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_user_id?: string | null
          organisation_id?: string | null
          referrer_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_user_id?: string | null
          organisation_id?: string | null
          referrer_id?: string | null
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          account_id: string | null
          analytics: Json | null
          attempts: number | null
          caption: string
          created_at: string | null
          error_message: string | null
          format: string | null
          hashtags: string | null
          id: string
          media_url: string | null
          members: string[] | null
          platform_post_id: string | null
          platform_response: Json | null
          platforms: string[] | null
          scheduled_for: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          analytics?: Json | null
          attempts?: number | null
          caption: string
          created_at?: string | null
          error_message?: string | null
          format?: string | null
          hashtags?: string | null
          id?: string
          media_url?: string | null
          members?: string[] | null
          platform_post_id?: string | null
          platform_response?: Json | null
          platforms?: string[] | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          analytics?: Json | null
          attempts?: number | null
          caption?: string
          created_at?: string | null
          error_message?: string | null
          format?: string | null
          hashtags?: string | null
          id?: string
          media_url?: string | null
          members?: string[] | null
          platform_post_id?: string | null
          platform_response?: Json | null
          platforms?: string[] | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      self_assessment: {
        Row: {
          amount: number
          created_at: string
          date: string | null
          description: string | null
          id: string
          organisation_id: string | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "self_assessment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          bank_info: Json | null
          brand_color: string | null
          campaigns: string[] | null
          company_details: string | null
          email_campaigns: string | null
          font_family: string | null
          font_preference: string | null
          id: string
          logo_url: string | null
          next_of_kin_phone: string | null
          organisation_id: string | null
          secondary_color: string | null
          social_links: Json | null
          team_id: string | null
          ui_density: string | null
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          bank_info?: Json | null
          brand_color?: string | null
          campaigns?: string[] | null
          company_details?: string | null
          email_campaigns?: string | null
          font_family?: string | null
          font_preference?: string | null
          id?: string
          logo_url?: string | null
          next_of_kin_phone?: string | null
          organisation_id?: string | null
          secondary_color?: string | null
          social_links?: Json | null
          team_id?: string | null
          ui_density?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          bank_info?: Json | null
          brand_color?: string | null
          campaigns?: string[] | null
          company_details?: string | null
          email_campaigns?: string | null
          font_family?: string | null
          font_preference?: string | null
          id?: string
          logo_url?: string | null
          next_of_kin_phone?: string | null
          organisation_id?: string | null
          secondary_color?: string | null
          social_links?: Json | null
          team_id?: string | null
          ui_density?: string | null
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "settings_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          instagram_business_account_id: string | null
          organisation_id: string | null
          platform: string
          platform_user_id: string | null
          refresh_token: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_business_account_id?: string | null
          organisation_id?: string | null
          platform: string
          platform_user_id?: string | null
          refresh_token?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          instagram_business_account_id?: string | null
          organisation_id?: string | null
          platform?: string
          platform_user_id?: string | null
          refresh_token?: string | null
          user_id?: string
        }
        Relationships: []
      }
      social_tokens: {
        Row: {
          access_token: string
          account_name: string | null
          created_at: string
          id: string
          organisation_id: string | null
          platform: string
          platform_account_id: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          account_name?: string | null
          created_at?: string
          id?: string
          organisation_id?: string | null
          platform: string
          platform_account_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          account_name?: string | null
          created_at?: string
          id?: string
          organisation_id?: string | null
          platform?: string
          platform_account_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      socials: {
        Row: {
          ai_model: string | null
          analytics: Json | null
          attempts: number | null
          caption: string
          created_at: string | null
          error: string | null
          format: string | null
          hashtags: string | null
          id: string
          last_attempt_at: string | null
          last_error: string | null
          media_url: string | null
          organisation_id: string | null
          platform: string | null
          platform_post_id: string | null
          platform_response: Json | null
          posted_at: string | null
          retry_count: number | null
          scheduled_for: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          ai_model?: string | null
          analytics?: Json | null
          attempts?: number | null
          caption: string
          created_at?: string | null
          error?: string | null
          format?: string | null
          hashtags?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          media_url?: string | null
          organisation_id?: string | null
          platform?: string | null
          platform_post_id?: string | null
          platform_response?: Json | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_for: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          ai_model?: string | null
          analytics?: Json | null
          attempts?: number | null
          caption?: string
          created_at?: string | null
          error?: string | null
          format?: string | null
          hashtags?: string | null
          id?: string
          last_attempt_at?: string | null
          last_error?: string | null
          media_url?: string | null
          organisation_id?: string | null
          platform?: string | null
          platform_post_id?: string | null
          platform_response?: Json | null
          posted_at?: string | null
          retry_count?: number | null
          scheduled_for?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriber_lists: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organisation_id: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organisation_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organisation_id?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_lists_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_lists_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          list_id: string | null
          name: string | null
          organisation_id: string | null
          status: string | null
          unsubscribed: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          list_id?: string | null
          name?: string | null
          organisation_id?: string | null
          status?: string | null
          unsubscribed?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          list_id?: string | null
          name?: string | null
          organisation_id?: string | null
          status?: string | null
          unsubscribed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "subscriber_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          active: boolean | null
          amount: number | null
          client_name: string | null
          id: string
          interval: string | null
          next_run: string | null
          organisation_id: string | null
          team_id: string | null
        }
        Insert: {
          active?: boolean | null
          amount?: number | null
          client_name?: string | null
          id?: string
          interval?: string | null
          next_run?: string | null
          organisation_id?: string | null
          team_id?: string | null
        }
        Update: {
          active?: boolean | null
          amount?: number | null
          client_name?: string | null
          id?: string
          interval?: string | null
          next_run?: string | null
          organisation_id?: string | null
          team_id?: string | null
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          organisation_id: string | null
          task_id: string | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          task_id?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          task_id?: string | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_files: {
        Row: {
          created_at: string | null
          file_url: string | null
          id: string
          organisation_id: string | null
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          organisation_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_url?: string | null
          id?: string
          organisation_id?: string | null
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          assignee: string | null
          color: string | null
          contact_id: string | null
          created_at: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          display_type: string | null
          due_date: string | null
          guests: string | null
          id: string
          is_private: boolean | null
          location: string | null
          meeting_link: string | null
          organisation_id: string | null
          position: number | null
          priority: string | null
          profile_id: string | null
          project_id: string | null
          status: string | null
          tags: string | null
          team_id: string | null
          title: string
          updated_at: string | null
          user_id: string
          vc_link: string | null
        }
        Insert: {
          assigned_to?: string | null
          assignee?: string | null
          color?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          display_type?: string | null
          due_date?: string | null
          guests?: string | null
          id?: string
          is_private?: boolean | null
          location?: string | null
          meeting_link?: string | null
          organisation_id?: string | null
          position?: number | null
          priority?: string | null
          profile_id?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string | null
          team_id?: string | null
          title: string
          updated_at?: string | null
          user_id?: string
          vc_link?: string | null
        }
        Update: {
          assigned_to?: string | null
          assignee?: string | null
          color?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          display_type?: string | null
          due_date?: string | null
          guests?: string | null
          id?: string
          is_private?: boolean | null
          location?: string | null
          meeting_link?: string | null
          organisation_id?: string | null
          position?: number | null
          priority?: string | null
          profile_id?: string | null
          project_id?: string | null
          status?: string | null
          tags?: string | null
          team_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vc_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_tasks_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      team: {
        Row: {
          billing_status: string | null
          company_name: string | null
          created_at: string | null
          id: string
          name: string | null
          organisation_id: string | null
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          billing_status?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          organisation_id?: string | null
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          billing_status?: string | null
          company_name?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          organisation_id?: string | null
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          role: string | null
          team_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          organisation_id: string | null
          plan: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organisation_id?: string | null
          plan: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organisation_id?: string | null
          plan?: string
        }
        Relationships: []
      }
      thread_participants: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          role: string | null
          thread_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          role?: string | null
          thread_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_tags: {
        Row: {
          created_at: string | null
          id: string
          organisation_id: string | null
          tag: string | null
          thread_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          tag?: string | null
          thread_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organisation_id?: string | null
          tag?: string | null
          thread_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thread_tags_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          created_at: string | null
          customer_id: string | null
          date: string | null
          description: string | null
          fri: number | null
          hourly_rate: number | null
          hours: number
          id: string
          mon: number | null
          organisation_id: string | null
          project_id: string | null
          sat: number | null
          sun: number | null
          task_id: string | null
          team_id: string | null
          thu: number | null
          tue: number | null
          user_id: string | null
          wed: number | null
          week_identifier: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          description?: string | null
          fri?: number | null
          hourly_rate?: number | null
          hours: number
          id?: string
          mon?: number | null
          organisation_id?: string | null
          project_id?: string | null
          sat?: number | null
          sun?: number | null
          task_id?: string | null
          team_id?: string | null
          thu?: number | null
          tue?: number | null
          user_id?: string | null
          wed?: number | null
          week_identifier?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          description?: string | null
          fri?: number | null
          hourly_rate?: number | null
          hours?: number
          id?: string
          mon?: number | null
          organisation_id?: string | null
          project_id?: string | null
          sat?: number | null
          sun?: number | null
          task_id?: string | null
          team_id?: string | null
          thu?: number | null
          tue?: number | null
          user_id?: string | null
          wed?: number | null
          week_identifier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      user_organisations: {
        Row: {
          organisation_id: string
          user_id: string
        }
        Insert: {
          organisation_id: string
          user_id: string
        }
        Update: {
          organisation_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organisations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      vat_returns: {
        Row: {
          amount: number
          created_at: string
          date: string | null
          description: string | null
          id: string
          organisation_id: string | null
          status: string | null
          team_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          organisation_id?: string | null
          status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vat_returns_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clarity_event_stream: {
        Row: {
          action: string | null
          created_at: string | null
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          severity: string | null
          task_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          severity?: string | null
          task_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          severity?: string | null
          task_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_org: { Args: never; Returns: string }
      increment_campaign_open: {
        Args: { campaign_id_input: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_org_member: { Args: { org_id: string }; Returns: boolean }
    }
    Enums: {
      note_visibility: "private" | "org" | "shared" | "assigned"
      project_health: "good" | "at_risk" | "critical"
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
      note_visibility: ["private", "org", "shared", "assigned"],
      project_health: ["good", "at_risk", "critical"],
    },
  },
} as const
