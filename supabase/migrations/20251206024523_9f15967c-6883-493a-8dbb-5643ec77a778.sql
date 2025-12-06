-- =============================================
-- FASE 1: Corrigir função can_access_lead para corretor ver leads manuais
-- =============================================

CREATE OR REPLACE FUNCTION public.can_access_lead(lead_property_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    CASE 
      -- Master: acesso total
      WHEN authorize('master'::user_role) THEN true
      -- Admin: acesso a todos exceto de outros admins
      WHEN authorize('admin'::user_role) THEN 
        lead_property_id IS NULL OR
        NOT EXISTS (
          SELECT 1 FROM properties p
          JOIN profiles pr ON pr.id = p.user_id
          WHERE p.id = lead_property_id AND pr.role = 'admin' AND pr.id != auth.uid()
        )
      -- Corretor: leads sem property_id (manuais) OU leads de imóveis próprios
      WHEN authorize('corretor'::user_role) THEN 
        lead_property_id IS NULL OR
        EXISTS (
          SELECT 1 FROM properties 
          WHERE id = lead_property_id AND user_id = auth.uid()
        )
      -- Outros: sem acesso
      ELSE false
    END
$function$;

-- =============================================
-- FASE 2: Adicionar tenant_id nas tabelas principais
-- =============================================

-- Adicionar tenant_id na tabela properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- Adicionar tenant_id na tabela leads
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- Adicionar tenant_id na tabela visits
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- Adicionar tenant_id na tabela chat_configurations
ALTER TABLE public.chat_configurations ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- Adicionar tenant_id na tabela site_settings
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- Adicionar tenant_id na tabela notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- Adicionar tenant_id na tabela commissions
ALTER TABLE public.commissions ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- Adicionar tenant_id na tabela knowledge_base_articles
ALTER TABLE public.knowledge_base_articles ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- =============================================
-- FASE 3: Migrar dados existentes para Maresia Litoral
-- =============================================

-- Atualizar properties
UPDATE public.properties SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- Atualizar leads
UPDATE public.leads SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- Atualizar visits
UPDATE public.visits SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- Atualizar chat_configurations
UPDATE public.chat_configurations SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- Atualizar site_settings
UPDATE public.site_settings SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- Atualizar notifications
UPDATE public.notifications SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- Atualizar commissions
UPDATE public.commissions SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- Atualizar knowledge_base_articles
UPDATE public.knowledge_base_articles SET tenant_id = '108654ce-e809-4f06-a86d-800e43c45c5e' WHERE tenant_id IS NULL;

-- =============================================
-- FASE 4: Criar índices para performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON public.properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_tenant_id ON public.visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_configurations_tenant_id ON public.chat_configurations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_site_settings_tenant_id ON public.site_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);

-- =============================================
-- FASE 5: Função helper para obter tenant_id efetivo
-- =============================================

CREATE OR REPLACE FUNCTION public.get_effective_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT tenant_id FROM profiles WHERE id = auth.uid()),
    NULL
  )
$function$;

-- =============================================
-- FASE 6: Atualizar RLS Policies para Properties
-- =============================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Anyone can view active properties" ON public.properties;
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Role-based property delete" ON public.properties;
DROP POLICY IF EXISTS "Role-based property management view" ON public.properties;
DROP POLICY IF EXISTS "Role-based property update" ON public.properties;

-- Criar novas policies com tenant isolation
CREATE POLICY "Public can view active properties"
ON public.properties FOR SELECT
USING (status = 'active');

CREATE POLICY "Tenant users can view all tenant properties"
ON public.properties FOR SELECT
USING (
  is_super_admin() OR
  tenant_id = get_user_tenant_id()
);

CREATE POLICY "Tenant users can insert properties"
ON public.properties FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  (is_super_admin() OR tenant_id = get_user_tenant_id())
);

CREATE POLICY "Tenant users can update own properties"
ON public.properties FOR UPDATE
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_property(user_id))
);

CREATE POLICY "Tenant users can delete own properties"
ON public.properties FOR DELETE
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_property(user_id))
);

-- =============================================
-- FASE 7: Atualizar RLS Policies para Leads
-- =============================================

-- Remover policies antigas
DROP POLICY IF EXISTS "Role-based lead delete" ON public.leads;
DROP POLICY IF EXISTS "Role-based lead select" ON public.leads;
DROP POLICY IF EXISTS "Role-based lead update" ON public.leads;
DROP POLICY IF EXISTS "allow_anonymous_insert" ON public.leads;

-- Criar novas policies com tenant isolation
CREATE POLICY "Anyone can insert leads"
ON public.leads FOR INSERT
WITH CHECK (true);

CREATE POLICY "Tenant users can view leads"
ON public.leads FOR SELECT
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_lead(property_id))
);

CREATE POLICY "Tenant users can update leads"
ON public.leads FOR UPDATE
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_lead(property_id))
);

CREATE POLICY "Tenant users can delete leads"
ON public.leads FOR DELETE
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_lead(property_id))
);

-- =============================================
-- FASE 8: Atualizar RLS Policies para Visits
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can create visits" ON public.visits;
DROP POLICY IF EXISTS "Master can manage all visits" ON public.visits;
DROP POLICY IF EXISTS "Role-based visit delete" ON public.visits;
DROP POLICY IF EXISTS "Role-based visit update" ON public.visits;
DROP POLICY IF EXISTS "Role-based visit view" ON public.visits;

CREATE POLICY "Anyone can create visits"
ON public.visits FOR INSERT
WITH CHECK (true);

CREATE POLICY "Tenant users can view visits"
ON public.visits FOR SELECT
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_visit(property_id))
);

CREATE POLICY "Tenant users can update visits"
ON public.visits FOR UPDATE
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_visit(property_id))
);

CREATE POLICY "Tenant users can delete visits"
ON public.visits FOR DELETE
USING (
  is_super_admin() OR
  (tenant_id = get_user_tenant_id() AND can_access_visit(property_id))
);

-- =============================================
-- FASE 9: Atualizar RLS Policies para Chat Configurations
-- =============================================

DROP POLICY IF EXISTS "Admin can manage chat configurations" ON public.chat_configurations;
DROP POLICY IF EXISTS "Master can manage chat configurations" ON public.chat_configurations;

CREATE POLICY "Super admin can manage all chat configurations"
ON public.chat_configurations FOR ALL
USING (is_super_admin());

CREATE POLICY "Tenant admin can manage own chat configurations"
ON public.chat_configurations FOR ALL
USING (
  tenant_id = get_user_tenant_id() AND
  authorize('admin'::user_role)
);

CREATE POLICY "Public can view active chat config"
ON public.chat_configurations FOR SELECT
USING (active = true AND tenant_id = get_user_tenant_id());

-- =============================================
-- FASE 10: Atualizar RLS Policies para Site Settings
-- =============================================

DROP POLICY IF EXISTS "Admin pode atualizar configs globais" ON public.site_settings;
DROP POLICY IF EXISTS "Admin pode consultar configs globais" ON public.site_settings;
DROP POLICY IF EXISTS "Admin pode inserir configs globais" ON public.site_settings;
DROP POLICY IF EXISTS "Master can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public pode ver configs globais" ON public.site_settings;

CREATE POLICY "Super admin can manage all site settings"
ON public.site_settings FOR ALL
USING (is_super_admin());

CREATE POLICY "Tenant admin can manage own site settings"
ON public.site_settings FOR ALL
USING (
  tenant_id = get_user_tenant_id() AND
  authorize('admin'::user_role)
);

CREATE POLICY "Public can view tenant site settings"
ON public.site_settings FOR SELECT
USING (tenant_id = get_user_tenant_id() OR tenant_id IS NULL);

-- =============================================
-- FASE 11: Atualizar RLS Policies para Notifications
-- =============================================

DROP POLICY IF EXISTS "Role-based notification update" ON public.notifications;
DROP POLICY IF EXISTS "Role-based notification view" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (
  is_super_admin() OR
  (user_id = auth.uid() AND (tenant_id IS NULL OR tenant_id = get_user_tenant_id()))
);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid() AND (tenant_id IS NULL OR tenant_id = get_user_tenant_id())
);