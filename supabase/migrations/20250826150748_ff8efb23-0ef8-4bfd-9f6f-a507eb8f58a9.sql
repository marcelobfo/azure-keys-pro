-- Fix RLS issues by creating security definer function and updating policies

-- 1. Create security definer function to get user email safely
CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS text AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Add ticket_id back to chat_sessions
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.support_tickets(id);

-- 3. Update RLS policies for chat_sessions
DROP POLICY IF EXISTS "Leads podem ver suas próprias sessões" ON public.chat_sessions;
DROP POLICY IF EXISTS "Leads can view their own sessions" ON public.chat_sessions;

CREATE POLICY "Leads can view their sessions by email" ON public.chat_sessions
FOR SELECT USING (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE email = public.get_user_email(auth.uid())
  )
);

-- 4. Update RLS policies for chat_messages
DROP POLICY IF EXISTS "Participantes podem ver mensagens" ON public.chat_messages;

CREATE POLICY "Participants can view messages" ON public.chat_messages
FOR SELECT USING (
  session_id IN (
    SELECT id FROM public.chat_sessions
    WHERE attendant_id = auth.uid() 
    OR lead_id IN (
      SELECT id FROM public.leads 
      WHERE email = public.get_user_email(auth.uid())
    )
  ) 
  OR auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE role IN ('admin', 'corretor')
  )
);

DROP POLICY IF EXISTS "Participantes podem atualizar status de leitura" ON public.chat_messages;

CREATE POLICY "Participants can update read status" ON public.chat_messages
FOR UPDATE USING (
  session_id IN (
    SELECT id FROM public.chat_sessions
    WHERE attendant_id = auth.uid() 
    OR lead_id IN (
      SELECT id FROM public.leads 
      WHERE email = public.get_user_email(auth.uid())
    )
  )
);