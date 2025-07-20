-- Fix attendant_availability constraint to allow upserts
ALTER TABLE public.attendant_availability 
DROP CONSTRAINT IF EXISTS attendant_availability_user_id_key;

-- Add unique constraint that allows upserts
ALTER TABLE public.attendant_availability 
ADD CONSTRAINT attendant_availability_user_id_unique UNIQUE (user_id);

-- Create support_tickets table that's missing and causing chat failures
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID REFERENCES public.leads(id),
    subject TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    priority TEXT NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES public.profiles(id),
    protocol_number TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for support_tickets
CREATE POLICY "Anyone can create support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins and corretores can view all tickets" 
ON public.support_tickets 
FOR SELECT 
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'corretor')
    )
    OR assigned_to = auth.uid()
    OR lead_id IN (
        SELECT id FROM public.leads 
        WHERE email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    )
);

CREATE POLICY "Admins and corretores can update tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'corretor')
    )
    OR assigned_to = auth.uid()
);

-- Create function to generate protocol numbers
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
    
    -- Get next sequence number for current year
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocol_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.support_tickets 
    WHERE protocol_number LIKE current_year || '%';
    
    protocol_num := current_year || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN protocol_num;
END;
$$;

-- Create trigger to auto-generate protocol numbers
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

CREATE TRIGGER support_tickets_protocol_trigger
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_protocol();

-- Add updated_at trigger to support_tickets
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to support_tickets table for realtime
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;