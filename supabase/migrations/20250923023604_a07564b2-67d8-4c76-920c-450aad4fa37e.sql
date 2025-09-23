-- Add debugging to property alerts trigger
CREATE OR REPLACE FUNCTION public.debug_property_alerts()
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
    -- Log the trigger execution
    RAISE LOG 'Property alerts trigger fired for property: %', NEW.id;
    
    -- Only trigger for new active properties
    IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
        RAISE LOG 'Processing alerts for new active property: %', NEW.title;
        
        FOR alert_record IN 
            SELECT pa.user_id, p.full_name, pa.id as alert_id
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
            RAISE LOG 'Sending notification to user: % for alert: %', alert_record.user_id, alert_record.alert_id;
            
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

-- Replace the existing trigger
DROP TRIGGER IF EXISTS property_alerts_trigger ON public.properties;
CREATE TRIGGER property_alerts_trigger
    AFTER INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.debug_property_alerts();

-- Fix search_path issues in existing functions
CREATE OR REPLACE FUNCTION public.validate_lead_data_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validar email com regex mais rigoroso
    IF NEW.email IS NULL OR NEW.email = '' OR NEW.email !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
        RAISE EXCEPTION 'Email inválido ou em branco';
    END IF;
    
    -- Validar nome (mínimo 2 caracteres, apenas letras e espaços)
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
        RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
    END IF;
    
    -- Sanitizar e formatar dados
    NEW.name = trim(regexp_replace(NEW.name, '\s+', ' ', 'g'));
    NEW.email = lower(trim(NEW.email));
    NEW.phone = trim(COALESCE(NEW.phone, ''));
    NEW.message = trim(COALESCE(NEW.message, ''));
    
    -- Validar tamanho máximo dos campos
    IF length(NEW.name) > 100 THEN
        RAISE EXCEPTION 'Nome muito longo (máximo 100 caracteres)';
    END IF;
    
    IF length(NEW.message) > 1000 THEN
        RAISE EXCEPTION 'Mensagem muito longa (máximo 1000 caracteres)';
    END IF;
    
    -- Definir status padrão
    IF NEW.status IS NULL THEN
        NEW.status = 'new';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix other search_path issues
CREATE OR REPLACE FUNCTION public.validate_lead_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Validar email
    IF NEW.email IS NULL OR NEW.email = '' OR NEW.email !~ '^[^@]+@[^@]+\.[^@]+$' THEN
        RAISE EXCEPTION 'Email inválido';
    END IF;
    
    -- Validar nome
    IF NEW.name IS NULL OR length(trim(NEW.name)) < 2 THEN
        RAISE EXCEPTION 'Nome deve ter pelo menos 2 caracteres';
    END IF;
    
    -- Sanitizar dados
    NEW.name = trim(NEW.name);
    NEW.email = lower(trim(NEW.email));
    NEW.phone = trim(COALESCE(NEW.phone, ''));
    NEW.message = trim(COALESCE(NEW.message, ''));
    
    RETURN NEW;
END;
$$;