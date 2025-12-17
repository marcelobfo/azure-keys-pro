-- Add owner data columns to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_phone TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS owner_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.properties.owner_name IS 'Nome do proprietário do imóvel';
COMMENT ON COLUMN public.properties.owner_phone IS 'Telefone do proprietário';
COMMENT ON COLUMN public.properties.owner_email IS 'Email do proprietário';
COMMENT ON COLUMN public.properties.owner_notes IS 'Observações sobre o proprietário';