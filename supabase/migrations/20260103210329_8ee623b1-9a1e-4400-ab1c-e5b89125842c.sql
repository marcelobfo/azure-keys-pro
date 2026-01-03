-- Atualizar função generate_property_code para incluir o novo tipo "construcao"
CREATE OR REPLACE FUNCTION public.generate_property_code(property_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    prefix text;
    counter integer;
    new_code text;
BEGIN
    CASE LOWER(property_type)
        WHEN 'casa' THEN prefix := 'CA';
        WHEN 'apartamento' THEN prefix := 'AP';
        WHEN 'apartamento_diferenciado' THEN prefix := 'AD';
        WHEN 'lote' THEN prefix := 'LT';
        WHEN 'cobertura' THEN prefix := 'CB';
        WHEN 'studio' THEN prefix := 'ST';
        WHEN 'loft' THEN prefix := 'LF';
        WHEN 'sala_comercial' THEN prefix := 'SC';
        WHEN 'construcao' THEN prefix := 'CN';
        ELSE prefix := 'IM';
    END CASE;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(property_code FROM LENGTH(prefix) + 2) AS INTEGER)), 0) + 1
    INTO counter
    FROM properties 
    WHERE property_code LIKE prefix || '-%';
    
    new_code := prefix || '-' || LPAD(counter::text, 3, '0');
    
    RETURN new_code;
END;
$function$;

-- Primeiro dropar a função existente com a assinatura antiga
DROP FUNCTION IF EXISTS public.generate_property_slug(text, text, text, text);

-- Recriar função generate_property_slug com novo tipo "construcao"
CREATE OR REPLACE FUNCTION public.generate_property_slug(
    property_type_input text,
    city_input text,
    title_input text,
    property_code_input text DEFAULT NULL::text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    base_slug text;
    final_slug text;
    counter integer := 0;
    type_abbrev text;
BEGIN
    CASE LOWER(property_type_input)
        WHEN 'apartamento' THEN type_abbrev := 'apartamento';
        WHEN 'apartamento_diferenciado' THEN type_abbrev := 'apartamento-diferenciado';
        WHEN 'casa' THEN type_abbrev := 'casa';
        WHEN 'cobertura' THEN type_abbrev := 'cobertura';
        WHEN 'lote' THEN type_abbrev := 'lote';
        WHEN 'studio' THEN type_abbrev := 'studio';
        WHEN 'loft' THEN type_abbrev := 'loft';
        WHEN 'sala_comercial' THEN type_abbrev := 'sala-comercial';
        WHEN 'construcao' THEN type_abbrev := 'construcao';
        ELSE type_abbrev := 'imovel';
    END CASE;
    
    base_slug := type_abbrev || '-' || 
                 generate_clean_slug(city_input) || '-' ||
                 generate_clean_slug(COALESCE(title_input, 'imovel'));
    
    IF property_code_input IS NOT NULL THEN
        base_slug := base_slug || '-' || generate_clean_slug(property_code_input);
    END IF;
    
    final_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM properties WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter::text;
    END LOOP;
    
    RETURN final_slug;
END;
$function$;

-- Criar índice único composto para site_settings (key + tenant_id)
ALTER TABLE site_settings DROP CONSTRAINT IF EXISTS site_settings_key_key;

DROP INDEX IF EXISTS site_settings_key_tenant_idx;
CREATE UNIQUE INDEX site_settings_key_tenant_idx 
ON site_settings (key, COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid));