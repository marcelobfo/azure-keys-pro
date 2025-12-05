-- Criar tabela de tenants para multi-tenant
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  slug TEXT UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Adicionar tenant_id à tabela profiles PRIMEIRO
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Adicionar tenant_id à tabela olx_settings
ALTER TABLE public.olx_settings ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_olx_settings_tenant ON public.olx_settings(tenant_id);

-- Adicionar tenant_id à tabela olx_integration
ALTER TABLE public.olx_integration ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id);

-- Função helper para verificar tenant do usuário
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM profiles WHERE id = auth.uid()
$$;

-- Políticas RLS para tenants
CREATE POLICY "Master can manage all tenants" ON public.tenants
  FOR ALL USING (authorize('master'::user_role));

CREATE POLICY "Admin can view own tenant" ON public.tenants
  FOR SELECT USING (id = get_user_tenant_id());

-- Atualizar RLS de olx_settings para considerar tenant
DROP POLICY IF EXISTS "Admin can manage OLX settings" ON public.olx_settings;
DROP POLICY IF EXISTS "Master can manage OLX settings" ON public.olx_settings;

CREATE POLICY "Master can manage OLX settings" ON public.olx_settings
  FOR ALL USING (authorize('master'::user_role));

CREATE POLICY "Admin can manage own tenant OLX settings" ON public.olx_settings
  FOR ALL USING (tenant_id = get_user_tenant_id());

-- Atualizar RLS de olx_integration para considerar tenant
DROP POLICY IF EXISTS "Users can view own OLX integration" ON public.olx_integration;
DROP POLICY IF EXISTS "Users can insert own OLX integration" ON public.olx_integration;
DROP POLICY IF EXISTS "Users can update own OLX integration" ON public.olx_integration;
DROP POLICY IF EXISTS "Users can delete own OLX integration" ON public.olx_integration;
DROP POLICY IF EXISTS "Master can manage all OLX integrations" ON public.olx_integration;

CREATE POLICY "Master can manage all OLX integrations" ON public.olx_integration
  FOR ALL USING (authorize('master'::user_role));

CREATE POLICY "Users can view own tenant OLX integration" ON public.olx_integration
  FOR SELECT USING (user_id = auth.uid() OR tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert own tenant OLX integration" ON public.olx_integration
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tenant OLX integration" ON public.olx_integration
  FOR UPDATE USING (user_id = auth.uid() OR tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete own tenant OLX integration" ON public.olx_integration
  FOR DELETE USING (user_id = auth.uid() OR tenant_id = get_user_tenant_id());

-- Trigger para atualizar updated_at nos tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();