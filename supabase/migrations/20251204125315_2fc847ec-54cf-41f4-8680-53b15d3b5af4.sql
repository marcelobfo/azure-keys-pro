-- Adicionar coluna hide_address na tabela properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS hide_address boolean DEFAULT false;