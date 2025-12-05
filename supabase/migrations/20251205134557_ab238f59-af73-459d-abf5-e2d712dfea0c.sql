-- Fase 1: Criar enum de roles (se não existir, criar novo)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('user', 'corretor', 'admin', 'super_admin');
    END IF;
END $$;

-- Fase 2: Criar tabela user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role, tenant_id)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Fase 3: Criar funções security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role_in_tenant(_user_id UUID, _role public.app_role, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id 
      AND role = _role 
      AND (tenant_id = _tenant_id OR role = 'super_admin')
  )
$$;

-- Fase 4: Migrar roles existentes da tabela profiles para user_roles
INSERT INTO public.user_roles (user_id, role, tenant_id)
SELECT 
  id,
  CASE 
    WHEN role::text = 'master' THEN 'super_admin'::public.app_role
    WHEN role::text = 'admin' THEN 'admin'::public.app_role
    WHEN role::text = 'corretor' THEN 'corretor'::public.app_role
    ELSE 'user'::public.app_role
  END,
  tenant_id
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role, tenant_id) DO NOTHING;

-- Fase 5: Criar tabela tenant_features
CREATE TABLE IF NOT EXISTS public.tenant_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID UNIQUE NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  chat_enabled BOOLEAN DEFAULT true,
  olx_enabled BOOLEAN DEFAULT false,
  leads_enabled BOOLEAN DEFAULT true,
  commissions_enabled BOOLEAN DEFAULT true,
  evolution_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  max_users INTEGER DEFAULT 10,
  max_properties INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tenant_features ENABLE ROW LEVEL SECURITY;

-- Fase 6: Políticas RLS para user_roles
CREATE POLICY "Super admin can manage all user roles"
ON public.user_roles FOR ALL
TO authenticated
USING (is_super_admin());

CREATE POLICY "Admin can view user roles in own tenant"
ON public.user_roles FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admin can manage user roles in own tenant"
ON public.user_roles FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id() 
  AND has_role(auth.uid(), 'admin'::public.app_role)
  AND role != 'super_admin'
);

-- Fase 7: Políticas RLS para tenant_features
CREATE POLICY "Super admin can manage tenant features"
ON public.tenant_features FOR ALL
TO authenticated
USING (is_super_admin());

CREATE POLICY "Admin can view own tenant features"
ON public.tenant_features FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id());

-- Fase 8: Atualizar políticas da tabela tenants para super_admin
DROP POLICY IF EXISTS "Admin can view own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Master can manage all tenants" ON public.tenants;

CREATE POLICY "Super admin can manage all tenants"
ON public.tenants FOR ALL
TO authenticated
USING (is_super_admin());

CREATE POLICY "Admin can view own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (id = get_user_tenant_id());

-- Fase 9: Trigger para updated_at em tenant_features
CREATE OR REPLACE FUNCTION public.update_tenant_features_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_tenant_features_updated_at ON public.tenant_features;
CREATE TRIGGER update_tenant_features_updated_at
    BEFORE UPDATE ON public.tenant_features
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tenant_features_updated_at();

-- Fase 10: Criar tenant_features para tenants existentes que não têm
INSERT INTO public.tenant_features (tenant_id)
SELECT id FROM public.tenants
WHERE id NOT IN (SELECT tenant_id FROM public.tenant_features)
ON CONFLICT (tenant_id) DO NOTHING;