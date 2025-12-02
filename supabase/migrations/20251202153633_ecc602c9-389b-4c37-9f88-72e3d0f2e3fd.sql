-- =============================================
-- FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- =============================================

-- Função para verificar se usuário tem acesso a uma propriedade
CREATE OR REPLACE FUNCTION public.can_access_property(prop_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      -- Master: acesso total
      WHEN authorize('master'::user_role) THEN true
      -- Admin: acesso a todos exceto de outros admins
      WHEN authorize('admin'::user_role) THEN 
        NOT EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = prop_user_id AND role = 'admin' AND id != auth.uid()
        )
      -- Corretor/User: apenas próprios
      ELSE prop_user_id = auth.uid()
    END
$$;

-- Função para verificar se usuário tem acesso ao lead (baseado no imóvel)
CREATE OR REPLACE FUNCTION public.can_access_lead(lead_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
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
      -- Corretor: apenas leads de imóveis próprios
      WHEN authorize('corretor'::user_role) THEN 
        lead_property_id IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM properties 
          WHERE id = lead_property_id AND user_id = auth.uid()
        )
      -- Outros: sem acesso
      ELSE false
    END
$$;

-- Função para verificar se usuário pode ver notificação
CREATE OR REPLACE FUNCTION public.can_access_notification(notif_user_id uuid, notif_type text, notif_data jsonb)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE 
      -- Master: acesso total às suas notificações
      WHEN authorize('master'::user_role) AND notif_user_id = auth.uid() THEN true
      -- Admin: acesso às suas notificações
      WHEN authorize('admin'::user_role) AND notif_user_id = auth.uid() THEN true
      -- Corretor: apenas notificações vinculadas aos seus imóveis
      WHEN authorize('corretor'::user_role) AND notif_user_id = auth.uid() THEN 
        notif_type NOT IN ('lead_assigned', 'property_alert', 'new_chat_session') OR
        (notif_data->>'property_id') IS NULL OR
        EXISTS (
          SELECT 1 FROM properties 
          WHERE id = (notif_data->>'property_id')::uuid AND user_id = auth.uid()
        )
      -- User: suas próprias notificações de alertas
      WHEN notif_user_id = auth.uid() THEN true
      ELSE false
    END
$$;

-- =============================================
-- ATUALIZAR POLÍTICAS RLS - PROPERTIES
-- =============================================

-- Remover políticas antigas conflitantes
DROP POLICY IF EXISTS "Property owners and corretores can manage properties" ON properties;
DROP POLICY IF EXISTS "Users can manage own properties" ON properties;
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON properties;
DROP POLICY IF EXISTS "Master can manage all properties" ON properties;

-- Nova política para SELECT (visualização de gestão)
CREATE POLICY "Role-based property management view" ON properties
FOR SELECT USING (
  status = 'active' OR -- Público pode ver ativos
  can_access_property(user_id)
);

-- Nova política para UPDATE
CREATE POLICY "Role-based property update" ON properties
FOR UPDATE USING (can_access_property(user_id));

-- Nova política para DELETE
CREATE POLICY "Role-based property delete" ON properties
FOR DELETE USING (can_access_property(user_id));

-- =============================================
-- ATUALIZAR POLÍTICAS RLS - LEADS
-- =============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "allow_authenticated_operations" ON leads;
DROP POLICY IF EXISTS "Master can manage all leads" ON leads;

-- Nova política para SELECT
CREATE POLICY "Role-based lead select" ON leads
FOR SELECT USING (can_access_lead(property_id));

-- Nova política para UPDATE
CREATE POLICY "Role-based lead update" ON leads
FOR UPDATE USING (can_access_lead(property_id));

-- Nova política para DELETE  
CREATE POLICY "Role-based lead delete" ON leads
FOR DELETE USING (can_access_lead(property_id));

-- =============================================
-- ATUALIZAR POLÍTICAS RLS - NOTIFICATIONS
-- =============================================

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Master can view all notifications" ON notifications;

-- Nova política para SELECT
CREATE POLICY "Role-based notification view" ON notifications
FOR SELECT USING (can_access_notification(user_id, type, data));

-- Nova política para UPDATE (marcar como lida)
CREATE POLICY "Role-based notification update" ON notifications
FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- ATUALIZAR TRIGGER DE NOTIFICAÇÃO DE LEADS
-- =============================================

CREATE OR REPLACE FUNCTION public.notify_new_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    property_owner_id uuid;
    master_record RECORD;
BEGIN
    -- Notifica APENAS o dono do imóvel (corretor)
    IF NEW.property_id IS NOT NULL THEN
        SELECT user_id INTO property_owner_id FROM properties WHERE id = NEW.property_id;
        IF property_owner_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (
                property_owner_id,
                'lead_assigned',
                'Novo lead para seu imóvel!',
                format('Lead: %s (%s)', NEW.name, NEW.email),
                jsonb_build_object(
                    'lead_id', NEW.id,
                    'property_id', NEW.property_id,
                    'name', NEW.name,
                    'email', NEW.email
                )
            );
        END IF;
    END IF;
    
    -- Notifica todos os MASTERS (eles têm acesso total)
    FOR master_record IN SELECT id FROM profiles WHERE role = 'master'
    LOOP
        -- Evitar duplicar notificação se o master for o dono do imóvel
        IF master_record.id != COALESCE(property_owner_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (
                master_record.id,
                'lead_assigned',
                'Novo lead cadastrado',
                format('Lead: %s (%s)', NEW.name, NEW.email),
                jsonb_build_object(
                    'lead_id', NEW.id,
                    'property_id', NEW.property_id,
                    'name', NEW.name,
                    'email', NEW.email
                )
            );
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;