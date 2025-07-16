-- Inserir configurações básicas do site se não existirem
INSERT INTO public.site_settings (key, value, updated_at) VALUES
  ('site_name', 'Maresia Litoral', now()),
  ('site_title', 'Maresia Litoral - Encontre o Imóvel dos Seus Sonhos', now()),
  ('site_description', 'Encontre o imóvel dos seus sonhos com a Maresia Litoral. Casas, apartamentos e terrenos de qualidade em todo o Brasil.', now())
ON CONFLICT (key) DO NOTHING;