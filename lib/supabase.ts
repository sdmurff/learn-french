import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      sentences: {
        Row: {
          id: string;
          text: string;
          difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
          theme: string;
          source: string;
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          difficulty: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
          theme?: string;
          source?: string;
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
          theme?: string;
          source?: string;
          audio_url?: string | null;
          created_at?: string;
        };
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          sentence_id: string;
          attempt_text: string;
          score: number;
          diff_json: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sentence_id: string;
          attempt_text: string;
          score: number;
          diff_json: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sentence_id?: string;
          attempt_text?: string;
          score?: number;
          diff_json?: any;
          created_at?: string;
        };
      };
    };
  };
};
