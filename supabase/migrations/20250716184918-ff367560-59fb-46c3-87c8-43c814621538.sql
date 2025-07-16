-- Adicionar campo slug na tabela properties
ALTER TABLE public.properties 
ADD COLUMN slug text UNIQUE;

-- Criar índice para performance nas buscas por slug
CREATE INDEX idx_properties_slug ON public.properties(slug) WHERE slug IS NOT NULL;

-- Função para gerar slugs limpos
CREATE OR REPLACE FUNCTION public.generate_clean_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
    clean_slug text;
BEGIN
    -- Remove acentos, converte para minúsculo e substitui espaços/caracteres especiais por hífens
    clean_slug := lower(input_text);
    clean_slug := translate(clean_slug, 
        'áàâãäåæçéèêëíìîïñóòôõöøúùûüýÿ', 
        'aaaaaaeceeeeiiiinooooooouuuyyy'
    );
    clean_slug := regexp_replace(clean_slug, '[^a-z0-9]+', '-', 'g');
    clean_slug := trim(both '-' from clean_slug);
    
    RETURN clean_slug;
END;
$function$;

-- Função para gerar slug único baseado nas propriedades do imóvel
CREATE OR REPLACE FUNCTION public.generate_property_slug(
    property_type_input text,
    city_input text,
    title_input text,
    property_code_input text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    type_abbrev text;
BEGIN
    -- Criar abreviação do tipo de propriedade
    CASE LOWER(property_type_input)
        WHEN 'apartamento' THEN type_abbrev := 'apartamento';
        WHEN 'casa' THEN type_abbrev := 'casa';
        WHEN 'cobertura' THEN type_abbrev := 'cobertura';
        WHEN 'lote' THEN type_abbrev := 'lote';
        WHEN 'studio' THEN type_abbrev := 'studio';
        WHEN 'loft' THEN type_abbrev := 'loft';
        ELSE type_abbrev := 'imovel';
    END CASE;
    
    -- Construir slug base: tipo-cidade-titulo-codigo
    base_slug := type_abbrev || '-' || 
                 generate_clean_slug(city_input) || '-' ||
                 generate_clean_slug(COALESCE(title_input, 'imovel'));
    
    -- Adicionar código da propriedade se existir
    IF property_code_input IS NOT NULL THEN
        base_slug := base_slug || '-' || generate_clean_slug(property_code_input);
    END IF;
    
    -- Garantir que o slug seja único
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter::text;
    END LOOP;
    
    RETURN final_slug;
END;
$function$;

-- Trigger para gerar slug automaticamente ao inserir nova propriedade
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug := generate_property_slug(NEW.property_type, NEW.city, NEW.title, NEW.property_code);
    END IF;
    RETURN NEW;
END;
$function$;

-- Criar trigger
CREATE TRIGGER auto_generate_property_slug
    BEFORE INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_slug();

-- Gerar slugs para propriedades existentes
UPDATE public.properties 
SET slug = generate_property_slug(property_type, city, title, property_code)
WHERE slug IS NULL;