-- Fix remaining database functions with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_chat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_property_views(property_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE public.properties 
    SET view_count = COALESCE(view_count, 0) + 1 
    WHERE id = property_id;
$$;

CREATE OR REPLACE FUNCTION public.generate_clean_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.is_business_hours()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.business_hours
        WHERE day_of_week = EXTRACT(DOW FROM NOW())
          AND is_active = true
          AND TO_CHAR(NOW(), 'HH24:MI') BETWEEN start_time AND end_time
    );
$$;

CREATE OR REPLACE FUNCTION public.notify_new_chat_session_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Apenas inserir notificação simples sem consultas complexas
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
        p.id,
        'new_chat_session',
        'Novo chat em espera',
        'Um novo chat foi iniciado',
        jsonb_build_object('session_id', NEW.id)
    FROM public.profiles p
    WHERE p.role IN ('admin', 'corretor');
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_property_slug(property_type_input text, city_input text, title_input text, property_code_input text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.generate_property_code(property_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_property_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.property_code IS NULL THEN
        NEW.property_code := generate_property_code(NEW.property_type);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug := generate_property_slug(NEW.property_type, NEW.city, NEW.title, NEW.property_code);
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_analytics_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    event_date DATE := DATE(NEW.created_at);
BEGIN
    -- Update or insert summary for the date
    INSERT INTO public.analytics_summary (date, page_views, unique_visitors, property_views, leads_generated, favorites_added, visits_scheduled, chat_messages)
    VALUES (
        event_date,
        CASE WHEN NEW.event_type = 'page_view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'unique_visitor' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'property_view' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'lead_created' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'favorite_added' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'visit_scheduled' THEN 1 ELSE 0 END,
        CASE WHEN NEW.event_type = 'chat_message' THEN 1 ELSE 0 END
    )
    ON CONFLICT (date) DO UPDATE SET
        page_views = analytics_summary.page_views + CASE WHEN NEW.event_type = 'page_view' THEN 1 ELSE 0 END,
        unique_visitors = analytics_summary.unique_visitors + CASE WHEN NEW.event_type = 'unique_visitor' THEN 1 ELSE 0 END,
        property_views = analytics_summary.property_views + CASE WHEN NEW.event_type = 'property_view' THEN 1 ELSE 0 END,
        leads_generated = analytics_summary.leads_generated + CASE WHEN NEW.event_type = 'lead_created' THEN 1 ELSE 0 END,
        favorites_added = analytics_summary.favorites_added + CASE WHEN NEW.event_type = 'favorite_added' THEN 1 ELSE 0 END,
        visits_scheduled = analytics_summary.visits_scheduled + CASE WHEN NEW.event_type = 'visit_scheduled' THEN 1 ELSE 0 END,
        chat_messages = analytics_summary.chat_messages + CASE WHEN NEW.event_type = 'chat_message' THEN 1 ELSE 0 END,
        updated_at = now();
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_chat_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert notification for online attendants
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
        aa.user_id,
        'new_chat_session',
        'Novo chat em espera',
        format('Cliente %s iniciou um chat sobre: %s', 
            (SELECT name FROM public.leads WHERE id = NEW.lead_id),
            COALESCE(NEW.subject, 'Assunto geral')
        ),
        jsonb_build_object(
            'session_id', NEW.id,
            'lead_id', NEW.lead_id,
            'subject', NEW.subject
        )
    FROM public.attendant_availability aa
    JOIN public.profiles p ON p.id = aa.user_id
    WHERE aa.is_online = true 
        AND aa.current_chats < aa.max_concurrent_chats
        AND p.role IN ('admin', 'corretor');
        
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_protocol_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    protocol_num TEXT;
    current_year TEXT;
    sequence_num INTEGER;
BEGIN
    current_year := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for current year by extracting only the last 6 digits after year
    SELECT COALESCE(MAX(CAST(RIGHT(protocol_number, 6) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.support_tickets 
    WHERE protocol_number LIKE current_year || '%'
    AND LENGTH(protocol_number) = 10; -- Ensure we only match YYYY######
    
    protocol_num := current_year || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN protocol_num;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_protocol()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.protocol_number IS NULL THEN
        NEW.protocol_number := generate_protocol_number();
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_property_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    alert_record RECORD;
    notification_title TEXT;
    notification_message TEXT;
BEGIN
    -- Only trigger for new active properties
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        FOR alert_record IN 
            SELECT DISTINCT pa.user_id, p.full_name
            FROM public.property_alerts pa
            JOIN public.profiles p ON p.id = pa.user_id
            WHERE pa.active = TRUE
                AND (pa.property_type IS NULL OR pa.property_type = NEW.property_type)
                AND (pa.city IS NULL OR LOWER(pa.city) = LOWER(NEW.city))
                AND (pa.min_price IS NULL OR NEW.price >= pa.min_price)
                AND (pa.max_price IS NULL OR NEW.price <= pa.max_price)
                AND (pa.min_bedrooms IS NULL OR NEW.bedrooms >= pa.min_bedrooms)
                AND (pa.max_bedrooms IS NULL OR NEW.bedrooms <= pa.max_bedrooms)
                AND (pa.min_area IS NULL OR NEW.area >= pa.min_area)
                AND (pa.max_area IS NULL OR NEW.area <= pa.max_area)
        LOOP
            notification_title := 'Novo imóvel que pode te interessar!';
            notification_message := format('Confira: %s em %s por %s', NEW.title, NEW.location, 
                TO_CHAR(NEW.price, 'FM999G999G999D00'));
            
            INSERT INTO public.notifications (user_id, type, title, message, data)
            VALUES (
                alert_record.user_id,
                'property_alert',
                notification_title,
                notification_message,
                jsonb_build_object(
                    'property_id', NEW.id,
                    'property_title', NEW.title,
                    'property_image', COALESCE(NEW.images[1], ''),
                    'property_price', NEW.price,
                    'property_location', NEW.location
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;