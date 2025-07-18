-- Criar tabela de sessões de chat
CREATE TABLE public.chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  attendant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended', 'abandoned')),
  subject TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de mensagens do chat
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('lead', 'attendant', 'bot')),
  sender_id UUID,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_status BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de disponibilidade dos atendentes
CREATE TABLE public.attendant_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  max_concurrent_chats INTEGER NOT NULL DEFAULT 3,
  current_chats INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendant_availability ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_sessions
CREATE POLICY "Leads podem ver suas próprias sessões" 
ON public.chat_sessions FOR SELECT 
USING (
  lead_id IN (SELECT id FROM public.leads WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
);

CREATE POLICY "Atendentes podem ver sessões que participam" 
ON public.chat_sessions FOR SELECT 
USING (
  attendant_id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'corretor'))
);

CREATE POLICY "Sistema pode inserir sessões" 
ON public.chat_sessions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Atendentes podem atualizar sessões" 
ON public.chat_sessions FOR UPDATE 
USING (
  attendant_id = auth.uid() OR 
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'corretor'))
);

-- Políticas RLS para chat_messages
CREATE POLICY "Participantes podem ver mensagens" 
ON public.chat_messages FOR SELECT 
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions 
    WHERE attendant_id = auth.uid() OR 
    lead_id IN (SELECT id FROM public.leads WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  ) OR
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'corretor'))
);

CREATE POLICY "Sistema pode inserir mensagens" 
ON public.chat_messages FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Participantes podem atualizar status de leitura" 
ON public.chat_messages FOR UPDATE 
USING (
  session_id IN (
    SELECT id FROM public.chat_sessions 
    WHERE attendant_id = auth.uid() OR 
    lead_id IN (SELECT id FROM public.leads WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  )
);

-- Políticas RLS para attendant_availability
CREATE POLICY "Atendentes podem gerenciar sua disponibilidade" 
ON public.attendant_availability FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Admins podem ver disponibilidade" 
ON public.attendant_availability FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'corretor'))
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_chat()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_chat();

CREATE TRIGGER update_attendant_availability_updated_at
  BEFORE UPDATE ON public.attendant_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_chat();

-- Índices para performance
CREATE INDEX idx_chat_sessions_lead_id ON public.chat_sessions(lead_id);
CREATE INDEX idx_chat_sessions_attendant_id ON public.chat_sessions(attendant_id);
CREATE INDEX idx_chat_sessions_status ON public.chat_sessions(status);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_timestamp ON public.chat_messages(timestamp);
CREATE INDEX idx_attendant_availability_user_id ON public.attendant_availability(user_id);
CREATE INDEX idx_attendant_availability_is_online ON public.attendant_availability(is_online);

-- Função para notificar novos chats
CREATE OR REPLACE FUNCTION public.notify_new_chat_session()
RETURNS TRIGGER AS $$
BEGIN
  -- Notifica atendentes online sobre nova sessão
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_chat_session
  AFTER INSERT ON public.chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_chat_session();