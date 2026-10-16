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
  os_number TEXT NOT NULL,
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

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_manage_own" ON profiles;

-- Since all users are admins (per user requirement), they can see all profiles
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT USING (true);

-- Users can insert/update their own profile
CREATE POLICY "profiles_manage_own" ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Profiles table RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Since all users are admins, they can see all inspections
CREATE POLICY "inspections_select_all" ON inspections
  FOR SELECT USING (true);

-- Users can insert/update their own inspections
CREATE POLICY "inspections_manage_own" ON inspections
  FOR ALL
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Inspection photos table RLS
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;

-- Since all users are admins, they can see all inspection photos
CREATE POLICY "inspection_photos_select_all" ON inspection_photos
  FOR SELECT USING (true);

-- Users can insert/update their own inspection photos
CREATE POLICY "inspection_photos_manage_own" ON inspection_photos
  FOR ALL
  USING (inspection_id IN (SELECT id FROM inspections WHERE profile_id = auth.uid()))
  WITH CHECK (inspection_id IN (SELECT id FROM inspections WHERE profile_id = auth.uid()));

-- Inspection steps table RLS
ALTER TABLE inspection_steps ENABLE ROW LEVEL SECURITY;

-- Since all users are admins, they can see all inspection steps
CREATE POLICY "inspection_steps_select_all" ON inspection_steps
  FOR SELECT USING (true);

-- Users can insert/update their own inspection steps
CREATE POLICY "inspection_steps_manage_own" ON inspection_steps
  FOR ALL
  USING (inspection_id IN (SELECT id FROM inspections WHERE profile_id = auth.uid()))
  WITH CHECK (inspection_id IN (SELECT id FROM inspections WHERE profile_id = auth.uid()));

-- Triggers and Functions

-- Function to handle new user creation
-- All users are created as admin (no exceptions)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.user_metadata->>'full_name', 'Técnico'),
    'admin'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
-- All users are admins (per user requirement)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (with DROP IF EXISTS to avoid duplication errors)
DROP POLICY IF EXISTS "Users can upload to inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete from inspection-photos" ON storage.objects;

CREATE POLICY "Users can upload to inspection-photos" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view inspection-photos" ON storage.objects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete from inspection-photos" ON storage.objects
  FOR DELETE USING (auth.uid() IS NOT NULL);