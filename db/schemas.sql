-- VistoriaTech Database Schema
-- Criado em: 2025-01-01
-- Contém 4 tabelas: profiles, inspections, inspection_photos, inspection_steps

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - Usuários do sistema (todos são admins)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role = 'admin'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspections table - Registros principais de vistoria
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  os_number TEXT,
  asset_number TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_os_asset UNIQUE (os_number, asset_number)
);

-- Inspection photos table - Fotos capturadas durante a vistoria
CREATE TABLE inspection_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL, -- ex: 'physical', 'diagnosis', 'os', 'config', 'pre-packaging'
  file_path TEXT NOT NULL, -- Caminho no Storage
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- em bytes
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE, -- quando enviado para o Google Drive
  google_drive_file_id TEXT, -- ID do arquivo no Google Drive
  google_drive_folder_id TEXT, -- ID da pasta no Google Drive
  
  -- Constraints
  CONSTRAINT check_file_size CHECK (file_size > 0 AND file_size <= 10485760) -- máximo 10MB
);

-- Inspection steps table - Etapas detalhadas da vistoria
CREATE TABLE inspection_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL, -- ex: 'physical', 'diagnosis', 'os', 'config', 'pre-packaging'
  step_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMP WITH TIME ZONE,
  additional_software TEXT, -- Software adicional descrito pelo técnico
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies

-- Profiles table RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;

-- Authenticated users can read their own profile only.
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

-- Allow users to insert their own profile (id must match their auth user id)
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Inspections table RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspections_select" ON inspections;
DROP POLICY IF EXISTS "inspections_insert" ON inspections;
DROP POLICY IF EXISTS "inspections_update" ON inspections;
DROP POLICY IF EXISTS "inspections_delete" ON inspections;

-- Allow all users to see all inspections (since all are admins)
CREATE POLICY "inspections_select" ON inspections
  FOR SELECT TO authenticated USING (true);

-- Allow users to insert their own inspections
CREATE POLICY "inspections_insert" ON inspections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);

-- Allow users to update their own inspections
CREATE POLICY "inspections_update" ON inspections
  FOR UPDATE TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Allow users to delete their own inspections
CREATE POLICY "inspections_delete" ON inspections
  FOR DELETE TO authenticated USING (auth.uid() = profile_id);

-- Inspection photos table RLS
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspection_photos_select" ON inspection_photos;
DROP POLICY IF EXISTS "inspection_photos_insert" ON inspection_photos;
DROP POLICY IF EXISTS "inspection_photos_update" ON inspection_photos;
DROP POLICY IF EXISTS "inspection_photos_delete" ON inspection_photos;

-- Allow all users to see all inspection photos (since all are admins)
CREATE POLICY "inspection_photos_select" ON inspection_photos
  FOR SELECT TO authenticated USING (true);

-- Allow users to insert their own inspection photos
CREATE POLICY "inspection_photos_insert" ON inspection_photos
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  );

-- Allow users to update their own inspection photos
CREATE POLICY "inspection_photos_update" ON inspection_photos
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  );

-- Allow users to delete their own inspection photos
CREATE POLICY "inspection_photos_delete" ON inspection_photos
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  );

-- Inspection steps table RLS
ALTER TABLE inspection_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inspection_steps_select" ON inspection_steps;
DROP POLICY IF EXISTS "inspection_steps_insert" ON inspection_steps;
DROP POLICY IF EXISTS "inspection_steps_update" ON inspection_steps;
DROP POLICY IF EXISTS "inspection_steps_delete" ON inspection_steps;

-- Allow all users to see all inspection steps (since all are admins)
CREATE POLICY "inspection_steps_select" ON inspection_steps
  FOR SELECT TO authenticated USING (true);

-- Allow users to insert their own inspection steps
CREATE POLICY "inspection_steps_insert" ON inspection_steps
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  );

-- Allow users to update their own inspection steps
CREATE POLICY "inspection_steps_update" ON inspection_steps
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  );

-- Allow users to delete their own inspection steps
CREATE POLICY "inspection_steps_delete" ON inspection_steps
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM inspections
      WHERE id = inspection_id AND profile_id = auth.uid()
    )
  );

-- Triggers and Functions

-- Function to handle new user creation
-- All users are created as admin (no exceptions)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Técnico'),
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger to call handle_new_user on auth user insert
CREATE TRIGGER on_auth_user_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to check if user is admin
-- All users are admins (per user requirement)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Function to get user role
-- All users are admins (per user requirement)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_role(UUID) FROM PUBLIC, anon, authenticated;

-- Indexes for performance
CREATE INDEX idx_inspections_profile_id ON inspections(profile_id);
CREATE INDEX idx_inspections_os_asset ON inspections(os_number, asset_number);
CREATE INDEX idx_inspection_photos_inspection_id ON inspection_photos(inspection_id);
CREATE INDEX idx_inspection_photos_step_id ON inspection_photos(step_id);
CREATE INDEX idx_inspection_steps_inspection_id ON inspection_steps(inspection_id);
CREATE INDEX idx_inspection_steps_step_id ON inspection_steps(step_id);

-- Comments for documentation
COMMENT ON TABLE profiles IS 'Usuários do sistema (todos são admins)';
COMMENT ON TABLE inspections IS 'Registros principais de vistoria de notebooks';
COMMENT ON TABLE inspection_photos IS 'Fotos capturadas durante as etapas da vistoria';
COMMENT ON TABLE inspection_steps IS 'Etapas detalhadas da vistoria (física, diagnóstico, SO, configuração, pré-embalagem)';

COMMENT ON COLUMN inspections.os_number IS 'Número da Ordem de Serviço';
COMMENT ON COLUMN inspections.asset_number IS 'Número do Ativo';
COMMENT ON COLUMN inspection_photos.step_id IS 'Identificador da etapa: physical, diagnosis, os, config, pre-packaging';
COMMENT ON COLUMN inspection_steps.step_id IS 'Identificador da etapa: physical, diagnosis, os, config, pre-packaging';
COMMENT ON COLUMN inspection_steps.additional_software IS 'Software adicional descrito pelo técnico durante a vistoria';

-- Storage bucket for photos
-- Creates the bucket for inspection photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload to inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from inspection-photos" ON storage.objects;

CREATE POLICY "Users can upload to inspection-photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'inspection-photos' AND EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id::text = split_part(storage.objects.name, '/', 1)
        AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can view inspection-photos" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'inspection-photos' AND EXISTS (
      SELECT 1 FROM public.inspection_photos
      WHERE file_path = storage.objects.name
    )
  );

CREATE POLICY "Users can delete from inspection-photos" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'inspection-photos' AND EXISTS (
      SELECT 1 FROM public.inspections
      WHERE id::text = split_part(storage.objects.name, '/', 1)
        AND profile_id = auth.uid()
    )
  );
