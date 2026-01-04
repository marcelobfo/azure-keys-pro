-- Permitir que usuários excluam suas próprias notificações
CREATE POLICY "Users can delete own notifications" 
ON public.notifications 
FOR DELETE 
USING (
  (user_id = auth.uid()) 
  AND ((tenant_id IS NULL) OR (tenant_id = get_user_tenant_id()))
);