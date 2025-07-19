
-- Criar tabela para tickets de suporte com protocolos únicos
CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_number text UNIQUE NOT NULL,
  lead_id uuid REFERENCES public.leads(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  subject text,
  initial_message text,
  resolution_notes text,
  assigned_to uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text
);

-- Criar tabela para horários comerciais
CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=domingo, 6=sábado
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Inserir horários comerciais padrão (Segunda a Sexta, 8h às 18h)
INSERT INTO public.business_hours (day_of_week, start_time, end_time) VALUES
(1, '08:00', '18:00'), -- Segunda
(2, '08:00', '18:00'), -- Terça
(3, '08:00', '18:00'), -- Quarta
(4, '08:00', '18:00'), -- Quinta
(5, '08:00', '18:00'); -- Sexta

-- Adicionar coluna ticket_id à tabela chat_sessions
ALTER TABLE public.chat_sessions 
ADD COLUMN ticket_id uuid REFERENCES public.support_tickets(id);

-- Função para gerar número de protocolo sequencial
CREATE OR REPLACE FUNCTION generate_protocol_number()
RETURNS text AS $$
DECLARE
    year_part text;
    sequence_part integer;
    protocol text;
BEGIN
    year_part := EXTRACT(YEAR FROM now())::text;
    
    -- Buscar próximo número sequencial para o ano atual
    SELECT COALESCE(MAX(CAST(SUBSTRING(protocol_number FROM LENGTH(year_part) + 1) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM public.support_tickets 
    WHERE protocol_number LIKE year_part || '%';
    
    protocol := year_part || LPAD(sequence_part::text, 6, '0');
    RETURN protocol;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar protocolo automaticamente
CREATE OR REPLACE FUNCTION auto_generate_protocol()
RETURNS trigger AS $$
BEGIN
    IF NEW.protocol_number IS NULL THEN
        NEW.protocol_number := generate_protocol_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_protocol
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_protocol();

-- Função para verificar se está em horário comercial
CREATE OR REPLACE FUNCTION is_business_hours()
RETURNS boolean AS $$
DECLARE
    current_day integer;
    current_time time;
    business_start time;
    business_end time;
BEGIN
    current_day := EXTRACT(DOW FROM now()); -- 0=domingo, 6=sábado
    current_time := EXTRACT(TIME FROM now());
    
    SELECT start_time, end_time
    INTO business_start, business_end
    FROM public.business_hours
    WHERE day_of_week = current_day AND is_active = true;
    
    IF business_start IS NULL THEN
        RETURN false; -- Dia não tem horário comercial configurado
    END IF;
    
    RETURN current_time >= business_start AND current_time <= business_end;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies para support_tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create support tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view their own tickets by email"
ON public.support_tickets FOR SELECT
USING (
    lead_id IN (
        SELECT id FROM public.leads 
        WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ) 
    OR 
    auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'corretor')
    )
);

CREATE POLICY "Attendants can update tickets"
ON public.support_tickets FOR UPDATE
USING (
    assigned_to = auth.uid() 
    OR 
    auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role IN ('admin', 'corretor')
    )
);

-- RLS Policies para business_hours
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business hours"
ON public.business_hours FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage business hours"
ON public.business_hours FOR ALL
USING (
    auth.uid() IN (
        SELECT id FROM public.profiles 
        WHERE role = 'admin'
    )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
    BEFORE UPDATE ON public.business_hours
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
