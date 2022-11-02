export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      api_usage_records: {
        Row: {
          id: number
          called_by: string
          called_at: string
          api_name: string
        }
        Insert: {
          id?: number
          called_by: string
          called_at?: string
          api_name: string
        }
        Update: {
          id?: number
          called_by?: string
          called_at?: string
          api_name?: string
        }
      }
      foods: {
        Row: {
          id: number
          user_id: string
          updated_at: string | null
          name: string
          image_url: string | null
          rating: number | null
          is_public: boolean
          description: string | null
        }
        Insert: {
          id?: number
          user_id: string
          updated_at?: string | null
          name: string
          image_url?: string | null
          rating?: number | null
          is_public?: boolean
          description?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          updated_at?: string | null
          name?: string
          image_url?: string | null
          rating?: number | null
          is_public?: boolean
          description?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          updated_at: string | null
          username: string | null
          avatar_url: string | null
          website: string | null
          email: string
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          avatar_url?: string | null
          website?: string | null
          email: string
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          avatar_url?: string | null
          website?: string | null
          email?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
