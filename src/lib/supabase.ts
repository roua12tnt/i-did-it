import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 値の検証
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase環境変数が設定されていません。NEXT_PUBLIC_SUPABASE_URLとNEXT_PUBLIC_SUPABASE_ANON_KEYを設定してください。')
}

if (!supabaseUrl.startsWith('https://')) {
  throw new Error('無効なSupabase URL: ' + supabaseUrl)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          birthday: string | null
          selected_message_set_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          birthday?: string | null
          selected_message_set_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          birthday?: string | null
          selected_message_set_id?: string | null
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
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          do_id: string
          achieved_date: string
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          do_id?: string
          achieved_date?: string
          memo?: string | null
          created_at?: string
        }
      }
      message_sets: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      praise_messages: {
        Row: {
          id: string
          set_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          set_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          message?: string
          created_at?: string
        }
      }
    }
  }
}