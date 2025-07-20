
-- Fix the generate_protocol_number function to correctly extract sequential part
-- This will prevent duplicate protocol numbers that cause 400 errors in chat-processor

CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS TEXT
LANGUAGE plpgsql
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

-- Also fix the original function used in the other migration file to be consistent
CREATE OR REPLACE FUNCTION auto_generate_protocol()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.protocol_number IS NULL THEN
        NEW.protocol_number := generate_protocol_number();
    END IF;
    RETURN NEW;
END;
$$;
