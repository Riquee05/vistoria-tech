/**
 * Supabase Integration for VistoriaTech
 * Handles database operations for inspection records
 */

import { createClient, SupabaseClient, Session } from "@supabase/supabase-js";

export interface Inspection {
  id?: string;
  asset_number: string;
  os_number: string;
  inspector: string;
  date: string;
  status: "in-progress" | "completed";
  screen_status?: string;
  case_status?: string;
  battery_status?: string;
  motherboard_brand?: string;
  components?: string[];
  ports?: string[];
  notes?: string;
  photos?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface InspectionPhoto {
  id?: string;
  inspection_id: string;
  photo_url: string;
  thumbnail_url?: string;
  compressed: boolean;
  created_at?: string;
}

export class SupabaseService {
  private client: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.client = createClient(supabaseUrl, supabaseKey);
    }
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async createInspection(inspection: Omit<Inspection, "id" | "created_at" | "updated_at">): Promise<Inspection | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from("inspections")
      .insert([inspection])
      .select()
      .single();

    if (error) {
      console.error("Error creating inspection:", error);
      return null;
    }

    return data;
  }

  async updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from("inspections")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating inspection:", error);
      return null;
    }

    return data;
  }

  async getInspection(id: string): Promise<Inspection | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from("inspections")
      .select()
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching inspection:", error);
      return null;
    }

    return data;
  }

  async listInspections(): Promise<Inspection[]> {
    if (!this.client) return [];

    const { data, error } = await this.client
      .from("inspections")
      .select()
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error listing inspections:", error);
      return [];
    }

    return data || [];
  }

  async deleteInspection(id: string): Promise<boolean> {
    if (!this.client) return false;

    const { error } = await this.client
      .from("inspections")
      .delete()
      .eq("id", id);

    return !error;
  }

  async addPhoto(photo: Omit<InspectionPhoto, "id" | "created_at">): Promise<InspectionPhoto | null> {
    if (!this.client) return null;

    const { data, error } = await this.client
      .from("inspection_photos")
      .insert([photo])
      .select()
      .single();

    if (error) {
      console.error("Error adding photo:", error);
      return null;
    }

    return data;
  }
}

export function getSupabaseService(): SupabaseService {
  return new SupabaseService();
}