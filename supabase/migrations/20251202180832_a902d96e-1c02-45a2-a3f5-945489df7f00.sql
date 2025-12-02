-- Função para verificar se usuário pode acessar a visita
CREATE OR REPLACE FUNCTION public.can_access_visit(visit_property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE 
      -- Master: acesso total
      WHEN authorize('master'::user_role) THEN true
      -- Admin: acesso total
      WHEN authorize('admin'::user_role) THEN true
      -- Corretor: apenas visitas dos seus imóveis
      WHEN authorize('corretor'::user_role) THEN 
        EXISTS (
          SELECT 1 FROM properties 
          WHERE id = visit_property_id AND user_id = auth.uid()
        )
      ELSE false
    END
$$;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins and corretores can view all visits" ON visits;
DROP POLICY IF EXISTS "Admins and corretores can update visits" ON visits;
DROP POLICY IF EXISTS "Admins and corretores can delete visits" ON visits;

-- Novas políticas baseadas em função
CREATE POLICY "Role-based visit view" ON visits
FOR SELECT USING (can_access_visit(property_id));

CREATE POLICY "Role-based visit update" ON visits
FOR UPDATE USING (can_access_visit(property_id));

CREATE POLICY "Role-based visit delete" ON visits
FOR DELETE USING (can_access_visit(property_id));