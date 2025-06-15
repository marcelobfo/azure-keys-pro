
-- Permite SELECT em site_settings para qualquer usuário, incluindo anônimos
CREATE POLICY "Public pode ver configs globais" 
  ON public.site_settings
  FOR SELECT
  TO public
  USING (true);

-- (mantém UPDATE/INSERT/DELETE restritos somente para admins conforme já está configurado)
