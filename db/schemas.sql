-- VistoriaTech Database Schema
-- Criado em: 2025-01-01
-- Contém 4 tabelas: profiles, inspections, inspection_photos, inspection_steps

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table - Usuários do sistema (técnicos)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('technician', 'admin')),
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

DROP POLICY IF EXISTS "profiles_select_admin_only" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin_only" ON profiles;

CREATE POLICY "profiles_select_admin_only" ON profiles
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_upsert_own" ON profiles
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Profiles table RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as vistorias
CREATE POLICY "inspections_select_admin_all" ON inspections
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Técnicos podem ver suas próprias vistorias
CREATE POLICY "inspections_select_own" ON inspections
  FOR SELECT USING (profile_id = auth.uid());

-- Técnicos podem inserir vistorias (criar nova)
CREATE POLICY "inspections_insert_own" ON inspections
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- Técnicos podem atualizar suas próprias vistorias (exceto status completed)
CREATE POLICY "inspections_update_own" ON inspections
  FOR UPDATE USING (profile_id = auth.uid());

-- Admins podem atualizar qualquer vistoria
CREATE POLICY "inspections_update_admin" ON inspections
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Inspection photos table RLS
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as fotos
CREATE POLICY "inspection_photos_select_admin_all" ON inspection_photos
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Técnicos podem ver fotos das vistorias que pertencem a eles
CREATE POLICY "inspection_photos_select_own" ON inspection_photos
  FOR SELECT USING (EXISTS (SELECT 1 FROM inspections WHERE id = inspection_id AND profile_id = auth.uid()));

-- Técnicos podem inserir fotos (upload)
CREATE POLICY "inspection_photos_insert_own" ON inspection_photos
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM inspections WHERE id = inspection_id AND profile_id = auth.uid()));

-- Inspection steps table RLS
ALTER TABLE inspection_steps ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todos os passos
CREATE POLICY "inspection_steps_select_admin_all" ON inspection_steps
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Técnicos podem ver passos das vistorias que pertencem a eles
CREATE POLICY "inspection_steps_select_own" ON inspection_steps
  FOR SELECT USING (EXISTS (SELECT 1 FROM inspections WHERE id = inspection_id AND profile_id = auth.uid()));

-- Técnicos podem inserir/atualizar seus próprios passos
CREATE POLICY "inspection_steps_insert_own" ON inspection_steps
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM inspections WHERE id = inspection_id AND profile_id = auth.uid()));

CREATE POLICY "inspection_steps_update_own" ON inspection_steps
  FOR UPDATE USING (EXISTS (SELECT 1 FROM inspections WHERE id = inspection_id AND profile_id = auth.uid()));

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
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE((SELECT role FROM profiles WHERE id = user_id), 'technician');
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
COMMENT ON TABLE profiles IS 'Usuários do sistema (técnicos e admins)';
COMMENT ON TABLE inspections IS 'Registros principais de vistoria de notebooks';
COMMENT ON TABLE inspection_photos IS 'Fotos capturadas durante as etapas da vistoria';
COMMENT ON TABLE inspection_steps IS 'Etapas detalhadas da vistoria (física, diagnóstico, SO, configuração, pré-embalagem)';

COMMENT ON COLUMN inspections.os_number IS 'Número da Ordem de Serviço';
COMMENT ON COLUMN inspections.asset_number IS 'Número do Ativo';
COMMENT ON COLUMN inspection_photos.step_id IS 'Identificador da etapa: physical, diagnosis, os, config, pre-packaging';
COMMENT ON COLUMN inspection_steps.step_id IS 'Identificador da etapa: physical, diagnosis, os, config, pre-packaging';
COMMENT ON COLUMN inspection_steps.additional_software IS 'Software adicional descrito pelo técnico durante a vistoria';