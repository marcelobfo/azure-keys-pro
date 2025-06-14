
-- Cria a tabela para configurações globais do site
CREATE TABLE public.site_settings (
  id serial PRIMARY KEY,
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilita Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Permite que apenas admins possam visualizar e editar configurações do site
-- (Ajuste conforme os papéis no sistema, exemplificado aqui)
CREATE POLICY "Admin pode consultar configs globais"
  ON public.site_settings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admin pode atualizar configs globais"
  ON public.site_settings
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Admin pode inserir configs globais"
  ON public.site_settings
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));
