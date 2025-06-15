
-- Adiciona configurações para imagens da home e layout selecionado

-- Adiciona chave para imagem do banner principal
INSERT INTO site_settings (key, value)
VALUES 
  ('home_banner_image', ''), -- URL da imagem do banner principal

-- Adiciona chave para imagem da seção Sobre
  ('about_section_image', ''), -- URL da imagem da seção Sobre

-- Adiciona chave para escolha do modelo de layout da home (ex: "modelo1", "modelo2", etc)
  ('home_layout', 'modelo1') -- valor inicial: modelo1

ON CONFLICT (key) DO NOTHING;
