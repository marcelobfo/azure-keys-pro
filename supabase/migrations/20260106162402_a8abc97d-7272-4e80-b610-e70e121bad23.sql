-- ========================================
-- CORREÇÃO 1: Política DELETE para profiles
-- ========================================

-- Permitir que admins deletem perfis do seu tenant
CREATE POLICY "Admins can delete tenant profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  is_super_admin() 
  OR (
    authorize('admin'::user_role) 
    AND tenant_id = get_user_tenant_id()
    AND id != auth.uid()
  )
);

-- ========================================
-- CORREÇÃO 2: Política DELETE para notifications
-- ========================================

-- Remover política existente problemática
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Recriar política mais simples
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (user_id = auth.uid());