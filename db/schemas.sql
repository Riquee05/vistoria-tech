-- VistoriaTech Database Schema
-- Execute this script in Supabase SQL Editor

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_number TEXT NOT NULL,
    os_number TEXT NOT NULL,
    inspector TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
    screen_status TEXT,
    case_status TEXT,
    battery_status TEXT,
    motherboard_brand TEXT,
    components TEXT[],
    ports TEXT[],
    notes TEXT,
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection photos table
CREATE TABLE IF NOT EXISTS inspection_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    compressed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_asset_number ON inspections(asset_number);
CREATE INDEX IF NOT EXISTS idx_inspections_os_number ON inspections(os_number);
CREATE INDEX IF NOT EXISTS idx_inspections_created_at ON inspections(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_inspection_id ON inspection_photos(inspection_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inspections_updated_at
    BEFORE UPDATE ON inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust as needed)
CREATE POLICY "Allow all for authenticated users" ON inspections
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON inspection_photos
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Grant access to anonymous users for demo mode
CREATE POLICY "Allow read for anonymous users" ON inspections
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow read for anonymous users" ON inspection_photos
    FOR SELECT TO anon
    USING (true);