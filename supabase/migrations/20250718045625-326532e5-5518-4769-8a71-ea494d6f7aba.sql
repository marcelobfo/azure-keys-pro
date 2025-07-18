-- Corrigir políticas RLS para permitir criação de sessões de chat por visitantes
-- A política atual "Sistema pode inserir sessões" está muito restritiva

-- Remover política atual
DROP POLICY IF EXISTS "Sistema pode inserir sessões" ON public.chat_sessions;

-- Nova política mais permissiva para criação de sessões
CREATE POLICY "Qualquer um pode criar sessões de chat" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (true);

-- Corrigir política de inserção de mensagens para permitir criação por visitantes
DROP POLICY IF EXISTS "Sistema pode inserir mensagens" ON public.chat_messages;

CREATE POLICY "Qualquer um pode enviar mensagens" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);