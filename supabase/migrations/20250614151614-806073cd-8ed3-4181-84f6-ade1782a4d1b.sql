
-- Fix the properties status constraint to allow the values being used
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_status_check;
ALTER TABLE properties ADD CONSTRAINT properties_status_check 
CHECK (status IN ('available', 'unavailable', 'sold', 'active'));
