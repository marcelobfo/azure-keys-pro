
-- Criar bucket para imagens de propriedades
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true);

-- Criar políticas para o bucket de imagens
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'property-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own files" ON storage.objects FOR UPDATE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Criar tabela para configurações de chat
CREATE TABLE public.chat_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  api_provider TEXT NOT NULL DEFAULT 'openai',
  api_key_encrypted TEXT,
  welcome_message TEXT DEFAULT 'Olá! Como posso ajudá-lo hoje?',
  active BOOLEAN DEFAULT true,
  custom_responses JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(company)
);

-- Criar tabela para agendamento de visitas
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.chat_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_configurations
CREATE POLICY "Users can view chat configurations" ON public.chat_configurations FOR SELECT USING (true);
CREATE POLICY "Users can insert chat configurations" ON public.chat_configurations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update chat configurations" ON public.chat_configurations FOR UPDATE USING (true);

-- Políticas RLS para visits
CREATE POLICY "Users can view visits" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Users can insert visits" ON public.visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update visits" ON public.visits FOR UPDATE USING (true);
CREATE POLICY "Users can delete visits" ON public.visits FOR DELETE USING (true);

-- Políticas RLS para leads (caso não existam)
CREATE POLICY "Users can view leads" ON public.leads FOR SELECT USING (true);
CREATE POLICY "Users can insert leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update leads" ON public.leads FOR UPDATE USING (true);

-- Políticas RLS para properties (caso não existam)
CREATE POLICY "Anyone can view properties" ON public.properties FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert properties" ON public.properties FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own properties" ON public.properties FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own properties" ON public.properties FOR DELETE USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_configurations_updated_at BEFORE UPDATE ON public.chat_configurations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
