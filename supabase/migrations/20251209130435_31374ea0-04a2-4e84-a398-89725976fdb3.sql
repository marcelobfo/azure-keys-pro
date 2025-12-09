-- Remover política antiga que não filtra por tenant
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Criar nova política que filtra admins por tenant
CREATE POLICY "Admins can view tenant profiles" ON public.profiles
FOR SELECT
USING (
  is_super_admin() OR 
  (authorize('admin'::user_role) AND tenant_id = get_user_tenant_id()) OR
  auth.uid() = id
);

-- Criar função helper para verificar acesso a profile por tenant
CREATE OR REPLACE FUNCTION public.can_access_profile(profile_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN is_super_admin() THEN true
      WHEN authorize('admin'::user_role) THEN 
        profile_tenant_id = get_user_tenant_id()
      ELSE false
    END
$$;

-- Remover entrada duplicada em user_roles (usuário com duas entradas)
DELETE FROM public.user_roles 
WHERE user_id = '6adfaf8c-39f0-457f-a607-1931f8f6b7af' 
AND tenant_id IS NULL
AND role = 'super_admin';

-- Garantir que propriedades sem tenant_id recebam o tenant correto baseado no user_id
UPDATE public.properties p
SET tenant_id = pr.tenant_id
FROM public.profiles pr
WHERE p.user_id = pr.id
AND p.tenant_id IS NULL
AND pr.tenant_id IS NOT NULL;