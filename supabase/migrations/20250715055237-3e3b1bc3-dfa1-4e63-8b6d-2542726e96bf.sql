-- Corrigir políticas RLS da tabela webhook_configurations
DROP POLICY IF EXISTS "Admins podem gerenciar webhooks" ON public.webhook_configurations;

-- Criar política correta para admins com USING e WITH CHECK
CREATE POLICY "Admins podem gerenciar webhooks" 
ON public.webhook_configurations 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);