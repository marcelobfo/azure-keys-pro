-- Adicionar campos para integração OLX na tabela properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS zipcode VARCHAR(9),
ADD COLUMN IF NOT EXISTS garage_spaces INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS olx_ad_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS olx_status VARCHAR(20) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS olx_last_sync TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS olx_error_message TEXT;

-- Criar tabela para tokens OAuth da OLX
CREATE TABLE IF NOT EXISTS public.olx_integration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Criar tabela para configurações da OLX
CREATE TABLE IF NOT EXISTS public.olx_settings (
  id SERIAL PRIMARY KEY,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  redirect_uri TEXT NOT NULL,
  default_phone VARCHAR(15),
  auto_publish BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.olx_integration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.olx_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para olx_integration
CREATE POLICY "Users can view own OLX integration"
ON public.olx_integration FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own OLX integration"
ON public.olx_integration FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own OLX integration"
ON public.olx_integration FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own OLX integration"
ON public.olx_integration FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Master can manage all OLX integrations"
ON public.olx_integration FOR ALL
USING (authorize('master'::user_role));

-- Políticas para olx_settings (apenas admin/master)
CREATE POLICY "Admin can manage OLX settings"
ON public.olx_settings FOR ALL
USING (authorize('admin'::user_role));

CREATE POLICY "Master can manage OLX settings"
ON public.olx_settings FOR ALL
USING (authorize('master'::user_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_olx_integration_updated_at
BEFORE UPDATE ON public.olx_integration
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_olx_settings_updated_at
BEFORE UPDATE ON public.olx_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();