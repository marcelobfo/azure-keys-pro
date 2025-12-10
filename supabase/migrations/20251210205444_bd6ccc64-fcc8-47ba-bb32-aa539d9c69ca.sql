-- Adicionar campos na tabela leads para rastreamento de origem OLX
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'site',
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS olx_list_id TEXT,
ADD COLUMN IF NOT EXISTS olx_ad_id TEXT,
ADD COLUMN IF NOT EXISTS olx_link TEXT;

-- Índice único para evitar duplicatas de leads da OLX
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_external_id ON public.leads(external_id) WHERE external_id IS NOT NULL;

-- Adicionar campos na tabela olx_settings para configuração de webhook de leads
ALTER TABLE public.olx_settings 
ADD COLUMN IF NOT EXISTS lead_webhook_token TEXT,
ADD COLUMN IF NOT EXISTS lead_config_id TEXT,
ADD COLUMN IF NOT EXISTS lead_webhook_url TEXT;