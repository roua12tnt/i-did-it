import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibtswcdocovzodwdmuzt.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlidHN3Y2RvY292em9kd2RtdXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MzE0ODUsImV4cCI6MjA2NTUwNzQ4NX0.YcRCMm-i67xWwc0YdNR1PRxoKU2sS2NT4QEuSIhy3dQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      dos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          do_id: string
          achieved_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          do_id: string
          achieved_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          do_id?: string
          achieved_date?: string
          created_at?: string
        }
      }
      praise_messages: {
        Row: {
          id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          message?: string
          created_at?: string
        }
      }
    }
  }
}