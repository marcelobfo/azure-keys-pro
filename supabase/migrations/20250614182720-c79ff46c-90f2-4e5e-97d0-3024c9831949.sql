
-- Add new columns to properties table for production-ready structure
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS purpose text, -- venda, aluguel, temporada
  ADD COLUMN IF NOT EXISTS reference_point text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS total_area numeric,
  ADD COLUMN IF NOT EXISTS suites integer,
  ADD COLUMN IF NOT EXISTS built_area numeric,
  ADD COLUMN IF NOT EXISTS condo_fee numeric,
  ADD COLUMN IF NOT EXISTS iptu_fee numeric,
  ADD COLUMN IF NOT EXISTS rental_price numeric,
  ADD COLUMN IF NOT EXISTS negotiation_notes text,
  ADD COLUMN IF NOT EXISTS broker_name text,
  ADD COLUMN IF NOT EXISTS broker_creci text,
  ADD COLUMN IF NOT EXISTS infra jsonb DEFAULT '[]'::jsonb
;

-- Opcionalmente, atribuir valores default nulos explicitamente
ALTER TABLE public.properties
  ALTER COLUMN purpose DROP NOT NULL,
  ALTER COLUMN reference_point DROP NOT NULL,
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL,
  ALTER COLUMN total_area DROP NOT NULL,
  ALTER COLUMN suites DROP NOT NULL,
  ALTER COLUMN built_area DROP NOT NULL,
  ALTER COLUMN condo_fee DROP NOT NULL,
  ALTER COLUMN iptu_fee DROP NOT NULL,
  ALTER COLUMN rental_price DROP NOT NULL,
  ALTER COLUMN negotiation_notes DROP NOT NULL,
  ALTER COLUMN broker_name DROP NOT NULL,
  ALTER COLUMN broker_creci DROP NOT NULL,
  ALTER COLUMN infra DROP NOT NULL
;

-- Atualizar comentários desnecessários e garantir consistência
