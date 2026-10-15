import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'technician' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          role?: 'technician' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'technician' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      inspections: {
        Row: {
          id: string;
          profile_id: string;
          os_number: string;
          asset_number: string;
          status: 'in_progress' | 'completed' | 'archived';
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          profile_id: string;
          os_number: string;
          asset_number: string;
          status?: 'in_progress' | 'completed' | 'archived';
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          profile_id?: string;
          os_number?: string;
          asset_number?: string;
          status?: 'in_progress' | 'completed' | 'archived';
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      inspection_photos: {
        Row: {
          id: string;
          inspection_id: string;
          step_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          uploaded_at: string;
          processed_at: string | null;
          google_drive_file_id: string | null;
          google_drive_folder_id: string | null;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          step_id: string;
          file_path: string;
          file_name: string;
          file_size: number;
          mime_type: string;
          uploaded_at?: string;
          processed_at?: string | null;
          google_drive_file_id?: string | null;
          google_drive_folder_id?: string | null;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          step_id?: string;
          file_path?: string;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          uploaded_at?: string;
          processed_at?: string | null;
          google_drive_file_id?: string | null;
          google_drive_folder_id?: string | null;
        };
      };
      inspection_steps: {
        Row: {
          id: string;
          inspection_id: string;
          step_id: string;
          step_name: string;
          description: string | null;
          status: 'pending' | 'in_progress' | 'completed';
          completed_at: string | null;
          additional_software: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          inspection_id: string;
          step_id: string;
          step_name: string;
          description?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          completed_at?: string | null;
          additional_software?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          inspection_id?: string;
          step_id?: string;
          step_name?: string;
          description?: string | null;
          status?: 'pending' | 'in_progress' | 'completed';
          completed_at?: string | null;
          additional_software?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Inspection = Database['public']['Tables']['inspections']['Row'];
export type InspectionPhoto = Database['public']['Tables']['inspection_photos']['Row'];
export type InspectionStep = Database['public']['Tables']['inspection_steps']['Row'];

export type InsertProfile = Database['public']['Tables']['profiles']['Insert'];
export type InsertInspection = Database['public']['Tables']['inspections']['Insert'];
export type InsertInspectionPhoto = Database['public']['Tables']['inspection_photos']['Insert'];
export type InsertInspectionStep = Database['public']['Tables']['inspection_steps']['Insert'];

export type UpdateProfile = Database['public']['Tables']['profiles']['Update'];
export type UpdateInspection = Database['public']['Tables']['inspections']['Update'];
export type UpdateInspectionPhoto = Database['public']['Tables']['inspection_photos']['Update'];
export type UpdateInspectionStep = Database['public']['Tables']['inspection_steps']['Update'];