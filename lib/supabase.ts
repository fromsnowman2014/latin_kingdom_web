import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          title: string
          description: string | null
          difficulty_level: number
          total_words: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          difficulty_level: number
          total_words: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          difficulty_level?: number
          total_words?: number
          created_at?: string
        }
      }
      vocabularies: {
        Row: {
          id: string
          assignment_id: string
          english_meaning: string
          latin_word: string
          difficulty: number
          word_length: number
          hints: any
        }
        Insert: {
          id?: string
          assignment_id: string
          english_meaning: string
          latin_word: string
          difficulty: number
          word_length: number
          hints?: any
        }
        Update: {
          id?: string
          assignment_id?: string
          english_meaning?: string
          latin_word?: string
          difficulty?: number
          word_length?: number
          hints?: any
        }
      }
      game_sessions: {
        Row: {
          id: string
          user_id: string
          assignment_id: string
          start_time: string
          end_time: string | null
          status: 'playing' | 'completed' | 'failed'
          final_score: number | null
          words_learned: number
          accuracy_rate: number | null
        }
        Insert: {
          id?: string
          user_id: string
          assignment_id: string
          start_time?: string
          end_time?: string | null
          status?: 'playing' | 'completed' | 'failed'
          final_score?: number | null
          words_learned?: number
          accuracy_rate?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          assignment_id?: string
          start_time?: string
          end_time?: string | null
          status?: 'playing' | 'completed' | 'failed'
          final_score?: number | null
          words_learned?: number
          accuracy_rate?: number | null
        }
      }
      learning_progress: {
        Row: {
          id: string
          user_id: string
          vocabulary_id: string
          attempts: number
          correct_answers: number
          last_answered: string | null
          mastery_level: number
        }
        Insert: {
          id?: string
          user_id: string
          vocabulary_id: string
          attempts?: number
          correct_answers?: number
          last_answered?: string | null
          mastery_level?: number
        }
        Update: {
          id?: string
          user_id?: string
          vocabulary_id?: string
          attempts?: number
          correct_answers?: number
          last_answered?: string | null
          mastery_level?: number
        }
      }
    }
  }
}