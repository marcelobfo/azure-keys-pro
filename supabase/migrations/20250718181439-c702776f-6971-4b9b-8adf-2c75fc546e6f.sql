-- Corrigir políticas RLS para chat_sessions
-- Permitir que usuários anônimos criem sessões de chat

-- Primeiro, vamos verificar e corrigir as políticas da tabela chat_sessions
DROP POLICY IF EXISTS "Users can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update chat sessions" ON public.chat_sessions;

-- Criar políticas para permitir acesso anônimo aos chats
CREATE POLICY "Anyone can create chat sessions" 
ON public.chat_sessions 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view chat sessions" 
ON public.chat_sessions 
FOR SELECT 
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
TO anon, authenticated
USING (true);

-- Também precisamos verificar se a tabela chat_messages está com as políticas corretas
DROP POLICY IF EXISTS "Users can create chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view chat messages" ON public.chat_messages;

CREATE POLICY "Anyone can create chat messages" 
ON public.chat_messages 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view chat messages" 
ON public.chat_messages 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Verificar se RLS está habilitado
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;