-- Migration: Seed items table with initial food recommendations
-- Run this in your Supabase SQL editor

-- First, ensure the items table exists (it should from initial setup)
-- This migration just seeds the data

-- Insert Dog Foods
INSERT INTO items (brand, name, item_type, calories_per_unit, serving_unit, protein_percent, fat_percent, fiber_percent, package_price, package_size, package_unit, source, use_count)
VALUES
  -- Dog Foods
  ('Open Farm', 'Ancient Grains Dry Dog Food – Homestead Turkey', 'dry', 425, 'cup', 26, 15, 4.5, 83.00, 22, 'lb', 'manual', 10),
  ('Northwest Naturals', 'Freeze-Dried Beef Dog Food', 'raw', 182, 'cup', 41, 34, 6, 47.66, 1.56, 'lb', 'manual', 8),
  ('JustFoodForDogs', 'Chicken & White Rice', 'wet', 248, 'cup', 6.5, 2.5, 1, 44.94, 4.69, 'lb', 'manual', 12),
  ('Honest Kitchen', 'Turkey Recipe', 'dry', 488, 'cup', 29, 18, 9.6, 59.99, 4, 'lb', 'manual', 7),
  ('Caru', 'Daily Dish Chicken Stew', 'wet', 179, 'cup', 5, 1.5, 2, 46.98, 9.38, 'lb', 'manual', 5),
  ('Orijen', 'Original Dry Dog Food', 'dry', 449, 'cup', 38, 18, 4, 129.99, 23.5, 'lb', 'manual', 15),
  
  -- Cat Foods
  ('Open Farm', 'Wild-Caught Salmon Dry Cat Food', 'dry', 470, 'cup', 37, 18, 3, 49.99, 8, 'lb', 'manual', 9),
  ('Northwest Naturals', 'Freeze-Dried Chicken Cat Food', 'raw', 134, 'cup', 45, 15, 5, 28.99, 0.69, 'lb', 'manual', 6),
  ('smallbatch Pets', 'Freeze-Dried Raw Cat Food – Chicken', 'raw', 190, 'cup', 63.7, 24.9, 1.22, 27.99, 0.63, 'lb', 'manual', 4),
  ('JustFoodForDogs', 'Frozen Fresh Cat Food – Fish & Chicken', 'wet', 336, 'cup', 12, 4.5, 0.5, 111.99, 7.88, 'lb', 'manual', 3),
  ('Tiki Cat', 'Luau Variety Pack Wet Food', 'wet', 120, 'can', 14, 2, 0.5, 29.99, 2.1, 'lb', 'manual', 11),
  
  -- Dog Treats
  ('Open Farm', 'Freeze-Dried Raw Dog Treats', 'treat', 2, 'piece', NULL, NULL, NULL, NULL, NULL, NULL, 'manual', 8),
  ('Whimzees', 'Natural Dental Chews', 'treat', 15, 'piece', NULL, NULL, NULL, NULL, NULL, NULL, 'manual', 6),
  
  -- Cat Treats
  ('smallbatch Pets', 'Freeze-Dried Raw Cat Treats', 'treat', 8, 'piece', NULL, NULL, NULL, NULL, NULL, NULL, 'manual', 5),
  ('Open Farm', 'Freeze-Dried Raw Cat Treats', 'treat', 3, 'piece', NULL, NULL, NULL, NULL, NULL, NULL, 'manual', 4)

ON CONFLICT DO NOTHING;

-- Note: The items table should already have RLS policies from initial setup
-- If not, run:
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Anyone can view items" ON items FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can create items" ON items FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Users can update own items" ON items FOR UPDATE USING (auth.uid() = created_by);
