
-- Adicionar campos que estão faltando na tabela properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_beachfront boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_near_beach boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_development boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Criar tabela para tokens de API
CREATE TABLE IF NOT EXISTS public.api_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  token_name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  permissions jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_used_at timestamp with time zone
);

-- Habilitar RLS na tabela api_tokens
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Política para admins gerenciarem tokens
CREATE POLICY "Admins can manage API tokens" ON public.api_tokens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Trigger para atualizar updated_at em api_tokens
CREATE TRIGGER update_api_tokens_updated_at
  BEFORE UPDATE ON public.api_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
