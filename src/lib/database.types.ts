export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          user_type: 'client' | 'provider'
          avatar_url: string | null
          bio: string | null
          phone: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          user_type: 'client' | 'provider'
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          user_type?: 'client' | 'provider'
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      skill_categories: {
        Row: {
          id: string
          name: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          created_at?: string
        }
      }
      provider_skills: {
        Row: {
          id: string
          provider_id: string
          category_id: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          category_id: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          category_id?: string
          is_available?: boolean
          created_at?: string
        }
      }
      skill_videos: {
        Row: {
          id: string
          provider_id: string
          category_id: string
          video_url: string
          thumbnail_url: string | null
          title: string
          description: string | null
          duration: number
          likes_count: number
          views_count: number
          created_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          category_id: string
          video_url: string
          thumbnail_url?: string | null
          title: string
          description?: string | null
          duration?: number
          likes_count?: number
          views_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          category_id?: string
          video_url?: string
          thumbnail_url?: string | null
          title?: string
          description?: string | null
          duration?: number
          likes_count?: number
          views_count?: number
          created_at?: string
        }
      }
      video_likes: {
        Row: {
          id: string
          video_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          created_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          client_id: string
          provider_id: string
          video_id: string | null
          category_id: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          preferred_date: string
          preferred_time: string
          location: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          provider_id: string
          video_id?: string | null
          category_id: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          preferred_date: string
          preferred_time: string
          location: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          provider_id?: string
          video_id?: string | null
          category_id?: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
          preferred_date?: string
          preferred_time?: string
          location?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          booking_id: string
          sender_id: string
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          sender_id: string
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          sender_id?: string
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          booking_id: string
          provider_id: string
          client_id: string
          rating: number
          review: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          provider_id: string
          client_id: string
          rating: number
          review?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          provider_id?: string
          client_id?: string
          rating?: number
          review?: string | null
          created_at?: string
        }
      }
    }
  }
}
