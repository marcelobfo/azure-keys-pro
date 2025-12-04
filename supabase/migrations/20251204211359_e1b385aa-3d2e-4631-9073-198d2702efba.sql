-- Tornar o campo email opcional na tabela leads
ALTER TABLE public.leads ALTER COLUMN email DROP NOT NULL;