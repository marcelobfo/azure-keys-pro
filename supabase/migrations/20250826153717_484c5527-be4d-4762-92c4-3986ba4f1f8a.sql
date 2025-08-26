
-- 1) Parametrização do provedor IA e hiperparâmetros

ALTER TABLE public.chat_configurations
  ADD COLUMN IF NOT EXISTS provider_model text DEFAULT 'gemini-2.0-flash-exp',
  ADD COLUMN IF NOT EXISTS temperature numeric DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  ADD COLUMN IF NOT EXISTS top_p numeric DEFAULT 0.9 CHECK (top_p > 0 AND top_p <= 1),
  ADD COLUMN IF NOT EXISTS max_tokens integer DEFAULT 800 CHECK (max_tokens > 0 AND max_tokens <= 4000),
  ADD COLUMN IF NOT EXISTS knowledge_base_enabled boolean DEFAULT false;

-- 2) Base de conhecimento (simples) com busca full-text

CREATE TABLE IF NOT EXISTS public.knowledge_base_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.knowledge_base_articles ENABLE ROW LEVEL SECURITY;

-- Políticas: admins e corretores podem gerenciar; demais não têm acesso direto
CREATE POLICY "Admins and corretores can view KB"
  ON public.knowledge_base_articles
  FOR SELECT
  USING (auth.uid() IN (SELECT profiles.id FROM public.profiles WHERE profiles.role = ANY (ARRAY['admin'::user_role,'corretor'::user_role])));

CREATE POLICY "Admins and corretores can insert KB"
  ON public.knowledge_base_articles
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT profiles.id FROM public.profiles WHERE profiles.role = ANY (ARRAY['admin'::user_role,'corretor'::user_role])));

CREATE POLICY "Admins and corretores can update KB"
  ON public.knowledge_base_articles
  FOR UPDATE
  USING (auth.uid() IN (SELECT profiles.id FROM public.profiles WHERE profiles.role = ANY (ARRAY['admin'::user_role,'corretor'::user_role])));

CREATE POLICY "Admins and corretores can delete KB"
  ON public.knowledge_base_articles
  FOR DELETE
  USING (auth.uid() IN (SELECT profiles.id FROM public.profiles WHERE profiles.role = ANY (ARRAY['admin'::user_role,'corretor'::user_role])));

-- Índice FTS (português) para melhorar relevância
CREATE INDEX IF NOT EXISTS kb_articles_fts_idx
  ON public.knowledge_base_articles
  USING GIN (to_tsvector('portuguese', coalesce(title,'') || ' ' || coalesce(content,'')));

-- Trigger para manter updated_at
CREATE TRIGGER kb_articles_set_updated_at
BEFORE UPDATE ON public.knowledge_base_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
