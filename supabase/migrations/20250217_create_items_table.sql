-- Migration: Create items table for food database
-- Run this in your Supabase SQL editor BEFORE running the seed migration

-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Basic Info
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('dry', 'wet', 'raw', 'treat', 'supplement')),
  
  -- Nutrition (required)
  calories_per_unit DECIMAL(8,2) NOT NULL,
  serving_unit TEXT NOT NULL CHECK (serving_unit IN ('cup', 'can', 'oz', 'g', 'piece', 'scoop', 'pump')),
  serving_grams DECIMAL(8,2),
  
  -- Nutrition (optional)
  protein_percent DECIMAL(5,2),
  fat_percent DECIMAL(5,2),
  fiber_percent DECIMAL(5,2),
  moisture_percent DECIMAL(5,2),
  
  -- Cost (optional)
  package_price DECIMAL(10,2),
  package_size DECIMAL(10,2),
  package_unit TEXT CHECK (package_unit IN ('oz', 'lb', 'kg', 'g', 'can', 'bag', 'box', 'piece')),
  currency TEXT DEFAULT 'USD',
  
  -- Calculated
  cost_per_serving DECIMAL(10,4),
  cost_per_calorie DECIMAL(10,6),
  
  -- Metadata
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'ocr', 'barcode')),
  barcode TEXT,
  image_url TEXT,
  
  -- Community
  use_count INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for search and filtering
CREATE INDEX IF NOT EXISTS items_search ON items USING GIN (to_tsvector('english', brand || ' ' || name));
CREATE INDEX IF NOT EXISTS items_type ON items(item_type);
CREATE INDEX IF NOT EXISTS items_popular ON items(use_count DESC);
CREATE INDEX IF NOT EXISTS items_brand ON items(brand);

-- Enable Row Level Security
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can read, authenticated can create, owners can update
CREATE POLICY "Anyone can view items"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create items"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own items"
  ON items FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_items_updated_at();
