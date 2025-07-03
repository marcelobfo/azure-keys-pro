
-- Adicionar os campos que estão faltando na tabela properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS property_code text,
ADD COLUMN IF NOT EXISTS is_beachfront boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_near_beach boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_development boolean DEFAULT false;

-- Atualizar purpose com valor padrão se não existir
UPDATE public.properties 
SET purpose = 'sale' 
WHERE purpose IS NULL;

-- Criar índice único para property_code se não existir
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_code ON public.properties(property_code);

-- Função para gerar código automático do imóvel
CREATE OR REPLACE FUNCTION generate_property_code(property_type text)
RETURNS text AS $$
DECLARE
    prefix text;
    counter integer;
    new_code text;
BEGIN
    -- Definir prefixo baseado no tipo
    CASE LOWER(property_type)
        WHEN 'casa' THEN prefix := 'CA';
        WHEN 'apartamento' THEN prefix := 'AP';
        WHEN 'lote' THEN prefix := 'LT';
        WHEN 'cobertura' THEN prefix := 'CB';
        WHEN 'studio' THEN prefix := 'ST';
        WHEN 'loft' THEN prefix := 'LF';
        ELSE prefix := 'IM';
    END CASE;
    
    -- Buscar próximo número disponível
    SELECT COALESCE(MAX(CAST(SUBSTRING(property_code FROM LENGTH(prefix) + 2) AS INTEGER)), 0) + 1
    INTO counter
    FROM properties 
    WHERE property_code LIKE prefix || '-%';
    
    -- Gerar código com zero à esquerda
    new_code := prefix || '-' || LPAD(counter::text, 3, '0');
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION auto_generate_property_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.property_code IS NULL THEN
        NEW.property_code := generate_property_code(NEW.property_type);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS trigger_auto_property_code ON public.properties;
CREATE TRIGGER trigger_auto_property_code
    BEFORE INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_property_code();

-- Atualizar propriedades existentes com códigos
UPDATE public.properties 
SET property_code = generate_property_code(property_type)
WHERE property_code IS NULL;

-- Adicionar configurações para seções da home se não existirem
INSERT INTO public.site_settings (key, value) 
SELECT 'home_sections_featured', 'true'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_sections_featured');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_sections_beachfront', 'true'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_sections_beachfront');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_sections_near_beach', 'true'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_sections_near_beach');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_sections_developments', 'true'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_sections_developments');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_sections_order', '["featured", "beachfront", "near_beach", "developments"]'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_sections_order');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_banner_type', 'image'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_banner_type');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_banner_video_url', ''
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_banner_video_url');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_banner_link_type', 'internal'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_banner_link_type');

INSERT INTO public.site_settings (key, value) 
SELECT 'home_banner_link_url', '/properties'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'home_banner_link_url');
