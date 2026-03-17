
-- Add new columns for enhanced property registration
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS lavabos integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS development_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS development_description text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS apartment_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_apartment_details boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_pre_launch boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS building_features text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS unit_features text[] DEFAULT '{}'::text[];
